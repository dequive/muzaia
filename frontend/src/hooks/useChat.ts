// Chat functionality hook
import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChatStore, chatActions } from '@/store';
import { chatApi } from '@/lib/api';
import type { 
  GenerationRequest, 
  Message, 
  Conversation, 
  ContextType,
  StreamChunk 
} from '@/types';
import { toast } from 'react-hot-toast';

export function useChat(conversationId?: string) {
  const {
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    chatSettings,
    setCurrentConversation,
    addMessage,
    updateMessage,
  } = useChatStore();

  const queryClient = useQueryClient();
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Query para buscar conversas
  const {
    data: conversations = [],
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
  });

  // Query para buscar mensagens da conversa atual
  const {
    data: conversationMessages = [],
    isLoading: loadingMessages,
  } = useQuery({
    queryKey: ['messages', conversationId || currentConversation?.id],
    queryFn: () => {
      const id = conversationId || currentConversation?.id;
      return id ? chatApi.getMessages(id) : Promise.resolve([]);
    },
    enabled: !!(conversationId || currentConversation?.id),
  });

  // Mutation para gerar resposta
  const generateMutation = useMutation({
    mutationFn: async (request: GenerationRequest) => {
      chatActions.setLoading(true);
      
      try {
        const response = await chatApi.generate(request);
        return response;
      } finally {
        chatActions.setLoading(false);
      }
    },
    onSuccess: (response, variables) => {
      // Adicionar resposta do assistente
      const assistantMessage = chatActions.addAssistantMessage(
        response.response,
        {
          model_responses: response.model_responses,
          confidence: response.confidence,
          consensus_score: response.consensus_score,
          processing_time: response.processing_time,
          tokens_used: response.total_tokens,
          cost: response.total_cost,
          context: response.context_used,
          requires_review: response.requires_review,
        },
        variables.query // conversationId passado no request
      );

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });

      toast.success('Resposta gerada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na geração:', error);
      toast.error(error.message || 'Erro ao gerar resposta');
    },
  });

  // Mutation para streaming
  const streamMutation = useMutation({
    mutationFn: async (request: Omit<GenerationRequest, 'enable_streaming'>) => {
      chatActions.setStreaming(true);
      setStreamingMessage('');

      // Cancelar stream anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        let fullResponse = '';
        let messageId: string | null = null;

        for await (const chunk of chatApi.streamGenerate(request)) {
          // Verificar se foi cancelado
          if (abortControllerRef.current.signal.aborted) {
            break;
          }

          if (chunk.content) {
            fullResponse += chunk.content;
            setStreamingMessage(fullResponse);

            // Criar mensagem na primeira chunk
            if (!messageId) {
              const assistantMessage = chatActions.addAssistantMessage(
                fullResponse,
                { streaming: true },
                request.query // conversationId
              );
              messageId = assistantMessage?.id || null;
            } else if (messageId) {
              // Atualizar mensagem existente
              updateMessage(messageId, { content: fullResponse });
            }
          }

          if (chunk.is_final) {
            // Finalizar streaming
            if (messageId) {
              updateMessage(messageId, {
                content: fullResponse,
                metadata: {
                  streaming: false,
                  ...chunk.metadata,
                },
              });
            }
            break;
          }
        }

        return { message: fullResponse };
      } finally {
        chatActions.setStreaming(false);
        setStreamingMessage('');
        abortControllerRef.current = null;
      }
    },
    onError: (error: any) => {
      console.error('Erro no streaming:', error);
      toast.error(error.message || 'Erro no streaming');
      chatActions.setStreaming(false);
      setStreamingMessage('');
    },
  });

  // Mutation para criar conversa
  const createConversationMutation = useMutation({
    mutationFn: ({ title, context }: { title: string; context: ContextType }) =>
      chatApi.createConversation(title, context),
    onSuccess: (conversation) => {
      setCurrentConversation(conversation);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Nova conversa criada!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar conversa:', error);
      toast.error(error.message || 'Erro ao criar conversa');
    },
  });

  // Funções principais
  const sendMessage = useCallback(
    async (
      content: string,
      context: ContextType = chatSettings.default_context,
      useStreaming: boolean = chatSettings.enable_streaming
    ) => {
      if (!content.trim()) return;

      let conversation = currentConversation;

      // Criar conversa se não existir
      if (!conversation) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        const newConv = await createConversationMutation.mutateAsync({
          title,
          context,
        });
        conversation = newConv;
      }

      if (!conversation) {
        toast.error('Erro ao criar conversa');
        return;
      }

      // Adicionar mensagem do usuário
      chatActions.addUserMessage(content, conversation.id);

      // Preparar request
      const request: GenerationRequest = {
        query: content,
        context,
        user_id: conversation.user_id,
        params: chatSettings.generation_params,
        min_confidence: 0.7,
        enable_streaming: useStreaming,
      };

      // Gerar resposta
      if (useStreaming) {
        await streamMutation.mutateAsync(request);
      } else {
        await generateMutation.mutateAsync(request);
      }
    },
    [
      currentConversation,
      chatSettings,
      createConversationMutation,
      generateMutation,
      streamMutation,
    ]
  );

  const startNewChat = useCallback(
    (title?: string, context: ContextType = 'general') => {
      const conversationTitle = title || 'Nova Conversa';
      createConversationMutation.mutate({ title: conversationTitle, context });
    },
    [createConversationMutation]
  );

  const selectConversation = useCallback(
    (conversation: Conversation) => {
      setCurrentConversation(conversation);
    },
    [setCurrentConversation]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      chatActions.setStreaming(false);
      setStreamingMessage('');
      toast.info('Streaming cancelado');
    }
  }, []);

  const clearCurrentChat = useCallback(() => {
    chatActions.clearCurrentConversation();
  }, []);

  const regenerateLastResponse = useCallback(async () => {
    if (!currentConversation || conversationMessages.length < 2) {
      toast.error('Não há resposta para regenerar');
      return;
    }

    // Encontrar última mensagem do usuário
    const userMessages = conversationMessages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (lastUserMessage) {
      await sendMessage(
        lastUserMessage.content,
        currentConversation.context,
        chatSettings.enable_streaming
      );
    }
  }, [currentConversation, conversationMessages, sendMessage, chatSettings]);

  return {
    // Estado
    conversations,
    currentConversation,
    messages: conversationMessages,
    isLoading: isLoading || generateMutation.isPending,
    isStreaming: isStreaming || streamMutation.isPending,
    streamingMessage,
    loadingConversations,
    loadingMessages,

    // Funções
    sendMessage,
    startNewChat,
    selectConversation,
    stopStreaming,
    clearCurrentChat,
    regenerateLastResponse,
    refetchConversations,

    // Estados das mutations
    isGenerating: generateMutation.isPending,
    isCreatingConversation: createConversationMutation.isPending,
  };
}
