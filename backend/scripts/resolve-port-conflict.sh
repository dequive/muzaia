#!/bin/bash

# Porta que precisa ser liberada
PORT=8000

echo "Verificando processos na porta $PORT..."

# Verificar se a porta está em uso
PROCESS_INFO=$(sudo lsof -i -P -n | grep LISTEN | grep ":$PORT")

if [ -z "$PROCESS_INFO" ]; then
  echo "Nenhum processo está usando a porta $PORT."
else
  echo "Processo encontrado na porta $PORT:"
  echo "$PROCESS_INFO"

  # Extrair o PID do processo
  PID=$(echo "$PROCESS_INFO" | awk '{print $2}')

  echo "Finalizando o processo com PID: $PID..."
  sudo kill -9 "$PID"

  echo "Porta $PORT liberada com sucesso!"
fi

echo "Pronto para executar o contêiner Docker."
echo "Use o comando: docker run -d -p 8000:8000 --env-file .env muzaia/backend"
