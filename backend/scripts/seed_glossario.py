
#!/usr/bin/env python3
"""
Script para popular o glossário com termos jurídicos da legislação moçambicana
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.glossario import GlossarioTermo, CategoriaJuridica, NivelTecnico, StatusGlossario
import uuid

# Termos jurídicos específicos da legislação moçambicana
TERMOS_MOCAMBICANOS = [
    {
        "termo": "Assembleia da República",
        "definicao": "Órgão supremo do Estado de representação de todo o povo moçambicano, que exerce o poder legislativo na República de Moçambique.",
        "categoria": CategoriaJuridica.DIREITO_CONSTITUCIONAL,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "A Assembleia da República aprovou a nova lei de terras.",
        "lei_referencia": "Constituição da República de Moçambique",
        "artigo_referencia": "Artigo 168",
        "sinonimos": ["Parlamento", "Legislativo"],
        "tags": ["constituição", "parlamento", "poder legislativo"]
    },
    {
        "termo": "Direito de Uso e Aproveitamento da Terra (DUAT)",
        "definicao": "Direito que confere ao seu titular as faculdades de usar a terra e de aproveitar os recursos naturais nela existentes, respeitadas as disposições da presente Lei e demais legislação aplicável.",
        "categoria": CategoriaJuridica.LEI_TERRAS,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "O agricultor obteve o DUAT para explorar a parcela de terra.",
        "lei_referencia": "Lei nº 19/97",
        "artigo_referencia": "Artigo 13",
        "sinonimos": ["DUAT", "direito de terra"],
        "tags": ["terra", "agricultura", "propriedade", "DUAT"]
    },
    {
        "termo": "Lobolo",
        "definicao": "Instituição do direito costumeiro moçambicano pela qual a família do noivo entrega bens à família da noiva como forma de celebrar e validar o casamento tradicional.",
        "categoria": CategoriaJuridica.DIREITO_COSTUMEIRO,
        "nivel_tecnico": NivelTecnico.BASICO,
        "exemplo": "O lobolo foi realizado segundo as tradições da comunidade.",
        "lei_referencia": "Lei nº 10/2004",
        "artigo_referencia": "Artigo 15",
        "sinonimos": ["dote", "casamento tradicional"],
        "tags": ["casamento", "tradição", "família", "costumes"]
    },
    {
        "termo": "Autoridade Tradicional",
        "definicao": "Entidade que encarna o poder tradicional com legitimidade política e sócio-cultural, derivada de instituições endógenas, baseadas nos valores histórico-culturais da comunidade.",
        "categoria": CategoriaJuridica.DIREITO_COSTUMEIRO,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "A autoridade tradicional mediou o conflito entre as famílias.",
        "decreto_referencia": "Decreto nº 15/2000",
        "sinonimos": ["régulo", "chefe tradicional", "sobeta"],
        "tags": ["tradição", "autoridade", "comunidade", "mediação"]
    },
    {
        "termo": "Tribunal Comunitário",
        "definicao": "Estrutura da organização judiciária que tem jurisdição sobre pequenos delitos, contravenções e questões cíveis de menor complexidade, funcionando ao nível da localidade.",
        "categoria": CategoriaJuridica.CODIGO_PROCESSO_CIVIL,
        "nivel_tecnico": NivelTecnico.INTERMEDIARIO,
        "exemplo": "O caso foi julgado no tribunal comunitário da localidade.",
        "lei_referencia": "Lei nº 4/92",
        "sinonimos": ["tribunal local"],
        "tags": ["justiça", "comunidade", "tribunal", "localidade"]
    },
    {
        "termo": "Contravenção",
        "definicao": "Infração de menor gravidade punida com multa ou prisão correcional até seis meses, conforme o Código Penal moçambicano.",
        "categoria": CategoriaJuridica.CODIGO_PENAL,
        "nivel_tecnico": NivelTecnico.BASICO,
        "exemplo": "A venda ambulante sem licença constitui uma contravenção.",
        "lei_referencia": "Código Penal",
        "artigo_referencia": "Artigo 35",
        "sinonimos": ["infração menor"],
        "tags": ["crime", "multa", "infração", "penalidade"]
    },
    {
        "termo": "Licença de Exploração Mineira",
        "definicao": "Título que confere o direito de pesquisar, extrair e comercializar recursos minerais numa área determinada, pelo período e condições estabelecidas na lei.",
        "categoria": CategoriaJuridica.LEI_MINAS,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "A empresa obteve licença de exploração mineira para extrair carvão.",
        "lei_referencia": "Lei nº 20/2014",
        "sinonimos": ["concessão mineira", "título mineiro"],
        "tags": ["mineração", "licença", "exploração", "recursos"]
    },
    {
        "termo": "Regime Jurídico dos Investimentos",
        "definicao": "Conjunto de normas que regulam os investimentos privados em Moçambique, definindo incentivos, garantias e procedimentos para investidores nacionais e estrangeiros.",
        "categoria": CategoriaJuridica.LEI_INVESTIMENTO,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "O projeto enquadra-se no regime jurídico dos investimentos para beneficiar de incentivos fiscais.",
        "lei_referencia": "Lei nº 3/93",
        "sinonimos": ["lei de investimentos"],
        "tags": ["investimento", "economia", "incentivos", "business"]
    },
    {
        "termo": "Salário Mínimo Nacional",
        "definicao": "Remuneração mínima estabelecida por lei que deve ser paga a qualquer trabalhador em território moçambicano, revista periodicamente pelo Conselho de Ministros.",
        "categoria": CategoriaJuridica.LEI_TRABALHO,
        "nivel_tecnico": NivelTecnico.BASICO,
        "exemplo": "O empregador foi multado por pagar abaixo do salário mínimo nacional.",
        "lei_referencia": "Lei nº 23/2007",
        "sinonimos": ["remuneração mínima"],
        "tags": ["salário", "trabalhador", "remuneração", "lei"]
    },
    {
        "termo": "Habeas Corpus",
        "definicao": "Garantia constitucional que protege a liberdade individual contra prisões ilegais ou arbitrárias, permitindo que qualquer pessoa solicite a liberdade de quem esteja preso ilegalmente.",
        "categoria": CategoriaJuridica.DIREITO_CONSTITUCIONAL,
        "nivel_tecnico": NivelTecnico.AVANCADO,
        "exemplo": "O advogado impetrou habeas corpus em favor do réu preso ilegalmente.",
        "lei_referencia": "Constituição da República",
        "artigo_referencia": "Artigo 60",
        "sinonimos": ["remédio constitucional", "garantia de liberdade"],
        "tags": ["liberdade", "prisão", "garantia", "constitucional"]
    }
]

def seed_glossario():
    """Popular o glossário com termos jurídicos moçambicanos"""
    
    # Obter sessão do banco
    db = next(get_db())
    
    print("🇲🇿 Iniciando população do glossário jurídico moçambicano...")
    
    try:
        for termo_data in TERMOS_MOCAMBICANOS:
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
                lei_referencia=termo_data.get("lei_referencia"),
                artigo_referencia=termo_data.get("artigo_referencia"),
                decreto_referencia=termo_data.get("decreto_referencia"),
                tags=termo_data.get("tags", []),
                jurisdicao="mozambique",
                idioma="pt",
                versao="1.0",
                status=StatusGlossario.VALIDADO,
                revisado_por="sistema_juridico_mz",
                is_active=True
            )
            
            db.add(novo_termo)
            print(f"   ✅ Adicionado: {termo_data['termo']}")
        
        db.commit()
        print(f"\n🎉 Glossário jurídico moçambicano populado com sucesso!")
        print(f"   📊 Total de termos criados: {len(TERMOS_MOCAMBICANOS)}")
        print("   🏛️ Foco: Legislação e direito costumeiro de Moçambique")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao popular glossário: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_glossario()
