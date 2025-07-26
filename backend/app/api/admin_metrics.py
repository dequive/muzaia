
"""
API para métricas administrativas com capacidade de exportação.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
import structlog
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.piecharts import Pie
import json
import tempfile
import os

from app.database.connection import get_db_session
from app.models.admin_user import AdminUser

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/admin/metrics", tags=["admin-metrics"])

# Mock data generators for comprehensive metrics
def generate_user_behavior_metrics(days: int = 30):
    """Gerar métricas de comportamento do utilizador."""
    return {
        "active_users": {
            "daily_active": 1250,
            "weekly_active": 8500,
            "monthly_active": 25000,
            "growth_rate": 12.5
        },
        "session_metrics": {
            "avg_session_duration": 18.5,  # minutos
            "sessions_per_user": 3.2,
            "bounce_rate": 0.15,
            "retention_rate": 0.68
        },
        "feature_usage": {
            "chat_conversations": 15420,
            "document_uploads": 3240,
            "legal_consultations": 890,
            "professional_handoffs": 156
        },
        "geographic_distribution": [
            {"country": "Moçambique", "users": 18500, "percentage": 74.0},
            {"country": "Angola", "users": 3250, "percentage": 13.0},
            {"country": "Brasil", "users": 2000, "percentage": 8.0},
            {"country": "Portugal", "users": 1250, "percentage": 5.0}
        ]
    }

def generate_model_performance_metrics():
    """Gerar métricas de performance dos modelos."""
    return {
        "response_times": {
            "claude_3_5_sonnet": {"avg": 2.3, "p95": 4.1, "p99": 7.2},
            "gemini_pro": {"avg": 1.8, "p95": 3.5, "p99": 6.1},
            "local_model": {"avg": 0.9, "p95": 1.8, "p99": 3.2}
        },
        "token_usage": {
            "total_tokens_processed": 2450000,
            "input_tokens": 1200000,
            "output_tokens": 1250000,
            "cost_estimate": 245.50
        },
        "model_distribution": [
            {"model": "claude-3.5-sonnet", "usage_percentage": 55, "requests": 8250},
            {"model": "gemini-pro", "usage_percentage": 30, "requests": 4500},
            {"model": "local-model", "usage_percentage": 15, "requests": 2250}
        ],
        "availability": {
            "claude_uptime": 99.8,
            "gemini_uptime": 99.5,
            "local_uptime": 99.9
        }
    }

def generate_quality_metrics():
    """Gerar métricas de qualidade das respostas."""
    return {
        "user_satisfaction": {
            "avg_rating": 4.3,
            "total_ratings": 5420,
            "rating_distribution": {
                "5": 45, "4": 32, "3": 15, "2": 5, "1": 3
            }
        },
        "response_quality": {
            "accuracy_score": 0.87,
            "relevance_score": 0.91,
            "completeness_score": 0.84,
            "helpfulness_score": 0.89
        },
        "legal_accuracy": {
            "verified_responses": 890,
            "accuracy_rate": 0.94,
            "professional_corrections": 54,
            "user_disputes": 12
        },
        "feedback_analysis": {
            "positive_feedback": 78,
            "negative_feedback": 15,
            "improvement_suggestions": 42,
            "feature_requests": 23
        }
    }

def generate_security_metrics():
    """Gerar métricas de segurança e abuso."""
    return {
        "threat_detection": {
            "blocked_requests": 234,
            "malicious_uploads": 12,
            "spam_attempts": 89,
            "rate_limit_violations": 156
        },
        "content_moderation": {
            "flagged_conversations": 45,
            "inappropriate_content": 23,
            "user_reports": 34,
            "automated_blocks": 67
        },
        "security_incidents": {
            "failed_login_attempts": 1205,
            "suspicious_activities": 89,
            "account_lockouts": 23,
            "security_alerts": 5
        },
        "compliance": {
            "gdpr_requests": 12,
            "data_deletions": 8,
            "audit_logs": 15420,
            "compliance_score": 0.96
        }
    }

def generate_other_indicators():
    """Gerar outros indicadores importantes."""
    return {
        "system_health": {
            "cpu_usage": 45.2,
            "memory_usage": 67.8,
            "disk_usage": 23.4,
            "network_latency": 120
        },
        "business_metrics": {
            "conversion_rate": 0.034,
            "customer_lifetime_value": 450.00,
            "churn_rate": 0.08,
            "revenue_per_user": 12.50
        },
        "operational_metrics": {
            "support_tickets": 234,
            "resolution_time": 4.2,  # horas
            "first_response_time": 0.8,  # horas
            "customer_satisfaction": 4.1
        },
        "growth_metrics": {
            "user_acquisition": 234,
            "organic_growth": 67,
            "referral_signups": 45,
            "marketing_roi": 2.4
        }
    }

# Dependency para verificar admin
async def get_current_admin(db: AsyncSession = Depends(get_db_session)) -> AdminUser:
    # Mock admin verification
    return AdminUser(id="admin_123", email="admin@mozaia.com", is_active=True)

@router.get("/user-behavior")
async def get_user_behavior_metrics(
    days: int = Query(30, ge=1, le=365),
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter métricas de uso e comportamento do utilizador."""
    try:
        metrics = generate_user_behavior_metrics(days)
        return {
            "success": True,
            "metrics": metrics,
            "period": f"{days} dias",
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting user behavior metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-performance")
async def get_model_performance_metrics(
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter métricas de performance dos modelos."""
    try:
        metrics = generate_model_performance_metrics()
        return {
            "success": True,
            "metrics": metrics,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting model performance metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quality")
async def get_quality_metrics(
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter métricas de qualidade das respostas."""
    try:
        metrics = generate_quality_metrics()
        return {
            "success": True,
            "metrics": metrics,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting quality metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/security")
async def get_security_metrics(
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter métricas de segurança e abuso."""
    try:
        metrics = generate_security_metrics()
        return {
            "success": True,
            "metrics": metrics,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting security metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/other-indicators")
async def get_other_indicators(
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter outros indicadores importantes."""
    try:
        metrics = generate_other_indicators()
        return {
            "success": True,
            "metrics": metrics,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting other indicators", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/comprehensive")
async def get_comprehensive_metrics(
    days: int = Query(30, ge=1, le=365),
    admin: AdminUser = Depends(get_current_admin)
):
    """Obter todas as métricas de forma consolidada."""
    try:
        comprehensive_metrics = {
            "user_behavior": generate_user_behavior_metrics(days),
            "model_performance": generate_model_performance_metrics(),
            "quality": generate_quality_metrics(),
            "security": generate_security_metrics(),
            "other_indicators": generate_other_indicators()
        }
        
        return {
            "success": True,
            "metrics": comprehensive_metrics,
            "period": f"{days} dias",
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting comprehensive metrics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

def create_pdf_report(metrics_data: Dict[str, Any], report_title: str = "Relatório de Métricas Mozaia") -> str:
    """Criar relatório PDF das métricas."""
    # Criar arquivo temporário
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file.close()
    
    # Configurar documento PDF
    doc = SimpleDocTemplate(temp_file.name, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Estilo personalizado para título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        alignment=1,  # Center
        textColor=colors.HexColor('#1f2937')
    )
    
    # Título do relatório
    story.append(Paragraph(report_title, title_style))
    story.append(Spacer(1, 20))
    
    # Data de geração
    generation_date = datetime.utcnow().strftime('%d/%m/%Y às %H:%M UTC')
    story.append(Paragraph(f"Gerado em: {generation_date}", styles['Normal']))
    story.append(Spacer(1, 30))
    
    # Seção 1: Métricas de Comportamento do Utilizador
    if 'user_behavior' in metrics_data:
        story.append(Paragraph("1. Métricas de Uso e Comportamento do Utilizador", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        ub = metrics_data['user_behavior']
        
        # Utilizadores ativos
        active_data = [
            ['Métrica', 'Valor'],
            ['Utilizadores Ativos Diários', f"{ub['active_users']['daily_active']:,}"],
            ['Utilizadores Ativos Semanais', f"{ub['active_users']['weekly_active']:,}"],
            ['Utilizadores Ativos Mensais', f"{ub['active_users']['monthly_active']:,}"],
            ['Taxa de Crescimento', f"{ub['active_users']['growth_rate']:.1f}%"]
        ]
        
        table = Table(active_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Métricas de sessão
        session_data = [
            ['Métrica de Sessão', 'Valor'],
            ['Duração Média da Sessão', f"{ub['session_metrics']['avg_session_duration']:.1f} min"],
            ['Sessões por Utilizador', f"{ub['session_metrics']['sessions_per_user']:.1f}"],
            ['Taxa de Rejeição', f"{ub['session_metrics']['bounce_rate']:.1%}"],
            ['Taxa de Retenção', f"{ub['session_metrics']['retention_rate']:.1%}"]
        ]
        
        session_table = Table(session_data)
        session_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(session_table)
        story.append(Spacer(1, 30))
    
    # Seção 2: Performance dos Modelos
    if 'model_performance' in metrics_data:
        story.append(Paragraph("2. Métricas de Performance do Modelo", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        mp = metrics_data['model_performance']
        
        # Tempos de resposta
        response_data = [
            ['Modelo', 'Tempo Médio (s)', 'P95 (s)', 'P99 (s)']
        ]
        for model, times in mp['response_times'].items():
            response_data.append([
                model.replace('_', ' ').title(),
                f"{times['avg']:.1f}",
                f"{times['p95']:.1f}",
                f"{times['p99']:.1f}"
            ])
        
        response_table = Table(response_data)
        response_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(response_table)
        story.append(Spacer(1, 30))
    
    # Seção 3: Qualidade das Respostas  
    if 'quality' in metrics_data:
        story.append(Paragraph("3. Métricas de Qualidade da Resposta", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        quality = metrics_data['quality']
        
        # Satisfação do utilizador
        satisfaction_data = [
            ['Métrica de Qualidade', 'Valor'],
            ['Classificação Média', f"{quality['user_satisfaction']['avg_rating']:.1f}/5.0"],
            ['Total de Avaliações', f"{quality['user_satisfaction']['total_ratings']:,}"],
            ['Score de Precisão', f"{quality['response_quality']['accuracy_score']:.1%}"],
            ['Score de Relevância', f"{quality['response_quality']['relevance_score']:.1%}"],
            ['Score de Utilidade', f"{quality['response_quality']['helpfulness_score']:.1%}"]
        ]
        
        quality_table = Table(satisfaction_data)
        quality_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(quality_table)
        story.append(Spacer(1, 30))
    
    # Seção 4: Segurança
    if 'security' in metrics_data:
        story.append(Paragraph("4. Métricas de Segurança e Abuso", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        security = metrics_data['security']
        
        security_data = [
            ['Métrica de Segurança', 'Valor'],
            ['Requisições Bloqueadas', f"{security['threat_detection']['blocked_requests']:,}"],
            ['Uploads Maliciosos', f"{security['threat_detection']['malicious_uploads']:,}"],
            ['Tentativas de Spam', f"{security['threat_detection']['spam_attempts']:,}"],
            ['Violações de Rate Limit', f"{security['threat_detection']['rate_limit_violations']:,}"],
            ['Score de Compliance', f"{security['compliance']['compliance_score']:.1%}"]
        ]
        
        security_table = Table(security_data)
        security_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(security_table)
        story.append(Spacer(1, 30))
    
    # Seção 5: Outros Indicadores
    if 'other_indicators' in metrics_data:
        story.append(Paragraph("5. Outros Indicadores", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        others = metrics_data['other_indicators']
        
        indicators_data = [
            ['Indicador', 'Valor'],
            ['Uso de CPU', f"{others['system_health']['cpu_usage']:.1f}%"],
            ['Uso de Memória', f"{others['system_health']['memory_usage']:.1f}%"],
            ['Taxa de Conversão', f"{others['business_metrics']['conversion_rate']:.1%}"],
            ['Taxa de Churn', f"{others['business_metrics']['churn_rate']:.1%}"],
            ['Receita por Utilizador', f"${others['business_metrics']['revenue_per_user']:.2f}"]
        ]
        
        indicators_table = Table(indicators_data)
        indicators_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(indicators_table)
    
    # Rodapé
    story.append(Spacer(1, 50))
    story.append(Paragraph("Relatório gerado automaticamente pelo Sistema Mozaia", styles['Normal']))
    story.append(Paragraph("© 2024 Mozaia - Todos os direitos reservados", styles['Normal']))
    
    # Gerar PDF
    doc.build(story)
    
    return temp_file.name

@router.get("/export/pdf")
async def export_metrics_pdf(
    days: int = Query(30, ge=1, le=365),
    admin: AdminUser = Depends(get_current_admin)
):
    """Exportar métricas para PDF."""
    try:
        # Obter todas as métricas
        comprehensive_metrics = {
            "user_behavior": generate_user_behavior_metrics(days),
            "model_performance": generate_model_performance_metrics(),
            "quality": generate_quality_metrics(),
            "security": generate_security_metrics(),
            "other_indicators": generate_other_indicators()
        }
        
        # Gerar PDF
        pdf_path = create_pdf_report(
            comprehensive_metrics,
            f"Relatório de Métricas Mozaia - {datetime.utcnow().strftime('%d/%m/%Y')}"
        )
        
        # Retornar arquivo
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"mozaia_metrics_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
        )
        
    except Exception as e:
        logger.error("Error exporting metrics to PDF", error=str(e))
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")

@router.delete("/export/cleanup")
async def cleanup_temp_files(
    admin: AdminUser = Depends(get_current_admin)
):
    """Limpar arquivos temporários."""
    try:
        temp_dir = tempfile.gettempdir()
        cleaned_files = 0
        
        for filename in os.listdir(temp_dir):
            if filename.startswith('tmp') and filename.endswith('.pdf'):
                file_path = os.path.join(temp_dir, filename)
                try:
                    os.remove(file_path)
                    cleaned_files += 1
                except OSError:
                    continue
        
        return {
            "success": True,
            "message": f"Limpeza concluída: {cleaned_files} arquivos removidos"
        }
        
    except Exception as e:
        logger.error("Error cleaning up temp files", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
