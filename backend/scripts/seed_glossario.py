
#!/usr/bin/env python3
"""
Script para popular o glossário com termos jurídicos iniciais
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.glossario import GlossarioTermo, CategoriaJuridica, NivelTecnico, StatusGlossario
import uuid

# Termos iniciais para o glossário
TERMOS_INICIAIS = [
    {
        "termo": "Habeas Corpus",
        "definicao": "Instrumento jurídico que visa proteger o direito de liberdade de locomoção, impedindo ou cessando prisão ilegal ou abusiva.",
        "categoria": CategoriaJuridica.DIREITO_CONSTITUCIONAL,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "O advogado impetrou habeas corpus em favor do réu preso ilegalmente.",
        "sinonimos": ["remédio constitucional", "garantia de liberdade"],
        "tags": ["liberdade", "prisão", "constitucional", "garantia"]
    },
    {
        "termo": "Mandado de Segurança",
        "definicao": "Ação constitucional que visa proteger direito líquido e certo não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade for autoridade pública.",
        "categoria": CategoriaJuridica.DIREITO_CONSTITUCIONAL,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "Foi impetrado mandado de segurança contra o ato administrativo que negou a licença.",
        "sinonimos": ["MS", "remédio constitucional"],
        "tags": ["direito líquido", "autoridade pública", "ato administrativo"]
    },
    {
        "termo": "Petição Inicial",
        "definicao": "Peça processual que dá início ao processo judicial, contendo os fatos, fundamentos jurídicos e pedido do autor.",
        "categoria": CategoriaJuridica.PROCESSO_CIVIL,
        "nivel_tecnico": NivelTecnico.BASICO,
        "exemplo": "A petição inicial deve conter todos os requisitos previstos no artigo 319 do CPC.",
        "sinonimos": ["inicial", "peça inicial"],
        "tags": ["processo", "inicial", "petição", "autor"]
    },
    {
        "termo": "Contestação",
        "definicao": "Resposta do réu à petição inicial, apresentando sua defesa e eventuais alegações contra o pedido do autor.",
        "categoria": CategoriaJuridica.PROCESSO_CIVIL,
        "nivel_tecnico": NivelTecnico.BASICO,
        "exemplo": "O réu apresentou contestação negando os fatos alegados pelo autor.",
        "sinonimos": ["defesa", "resposta do réu"],
        "tags": ["defesa", "réu", "processo", "resposta"]
    },
    {
        "termo": "Dolo",
        "definicao": "Vontade livre e consciente de praticar um crime, abrangendo tanto a intenção direta quanto a eventual.",
        "categoria": CategoriaJuridica.DIREITO_PENAL,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "O réu agiu com dolo ao planejar e executar o crime premeditadamente.",
        "sinonimos": ["intenção criminosa", "má-fé"],
        "tags": ["crime", "intenção", "vontade", "consciência"]
    },
    {
        "termo": "Culpa",
        "definicao": "Conduta em que o agente, embora não querendo o resultado, age com negligência, imprudência ou imperícia.",
        "categoria": CategoriaJuridica.DIREITO_PENAL,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "O acidente ocorreu por culpa do motorista que dirigia em velocidade excessiva.",
        "sinonimos": ["negligência", "imprudência"],
        "tags": ["negligência", "imprudência", "imperícia", "responsabilidade"]
    },
    {
        "termo": "Usucapião",
        "definicao": "Modo originário de aquisição da propriedade pela posse prolongada da coisa, acompanhada de determinados requisitos legais.",
        "categoria": CategoriaJuridica.DIREITO_CIVIL,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "Após 15 anos de posse mansa e pacífica, o ocupante pode requerer a usucapião do imóvel.",
        "sinonimos": ["prescrição aquisitiva"],
        "tags": ["propriedade", "posse", "aquisição", "tempo"]
    },
    {
        "termo": "Sociedade Anônima",
        "definicao": "Tipo societário em que o capital social é dividido em ações, e a responsabilidade dos sócios é limitada ao valor das ações subscritas.",
        "categoria": CategoriaJuridica.DIREITO_COMERCIAL,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "A empresa se constituiu como sociedade anônima para facilitar a captação de investimentos.",
        "sinonimos": ["S.A.", "companhia"],
        "tags": ["sociedade", "ações", "capital", "responsabilidade limitada"]
    },
    {
        "termo": "Ato Administrativo",
        "definicao": "Manifestação unilateral de vontade da Administração Pública que, agindo nessa qualidade, tenha por fim imediato adquirir, resguardar, transferir, modificar, extinguir e declarar direitos.",
        "categoria": CategoriaJuridica.DIREITO_ADMINISTRATIVO,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "A concessão da licença ambiental é um ato administrativo vinculado.",
        "sinonimos": ["ato da administração"],
        "tags": ["administração pública", "vontade", "direitos", "vinculado"]
    },
    {
        "termo": "Salário Mínimo",
        "definicao": "Menor remuneração que um trabalhador pode receber por seu trabalho, fixada por lei e revista periodicamente.",
        "categoria": CategoriaJuridica.DIREITO_TRABALHO,
        "nivel_tecnico": NivelTecnico.BASICO,
        "exemplo": "O valor do salário mínimo em Moçambique é estabelecido por decreto governamental.",
        "sinonimos": ["remuneração mínima"],
        "tags": ["salário", "trabalhador", "remuneração", "lei"]
    }
]

def seed_glossario():
    """Popular o glossário com termos iniciais"""
    
    # Obter sessão do banco
    db = next(get_db())
    
    print("🌱 Iniciando população do glossário...")
    
    try:
        for termo_data in TERMOS_INICIAIS:
            # Verificar se o termo já existe
            existing = db.query(GlossarioTermo).filter(
                GlossarioTermo.termo == termo_data["termo"]
            ).first()
            
            if existing:
                print(f"   ⚠️  Termo '{termo_data['termo']}' já existe, pulando...")
                continue
            
            # Criar novo termo
            novo_termo = GlossarioTermo(
                id=uuid.uuid4(),
                termo=termo_data["termo"],
                definicao=termo_data["definicao"],
                categoria=termo_data["categoria"],
                nivel_tecnico=termo_data["nivel_tecnico"],
                exemplo=termo_data.get("exemplo"),
                sinonimos=termo_data.get("sinonimos", []),
                tags=termo_data.get("tags", []),
                jurisdicao="mozambique",
                idioma="pt",
                versao="1.0",
                status=StatusGlossario.VALIDADO,
                revisado_por="sistema",
                is_active=True
            )
            
            db.add(novo_termo)
            print(f"   ✅ Adicionado: {termo_data['termo']}")
        
        db.commit()
        print(f"\n🎉 Glossário populado com sucesso!")
        print(f"   📊 Total de termos criados: {len(TERMOS_INICIAIS)}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao popular glossário: {e}")
        raise
    
    finally:
        db.close()

if __name__ == "__main__":
    seed_glossario()
