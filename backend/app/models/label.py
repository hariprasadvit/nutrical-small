"""
Label model - Generated labels from product + template
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, LargeBinary, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Label(Base):
    """
    Generated label - result of combining a product with a template
    """
    __tablename__ = "labels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False)
    
    # Label name/version
    name = Column(String(255))
    version = Column(String(50), default="1.0")
    
    # Rendered data snapshot (nutrition values at time of generation)
    nutrition_snapshot = Column(JSON)
    # Example:
    # {
    #   "servingSize": 250,
    #   "servingUnit": "g",
    #   "calories": 564,
    #   "totalFat": 13.2,
    #   "saturatedFat": 1.5,
    #   ...
    # }
    
    # Rendered content
    rendered_html = Column(Text)  # HTML version for preview
    rendered_svg = Column(Text)   # SVG version for export
    
    # Cached exports (optional - can regenerate)
    png_data = Column(LargeBinary)  # Cached PNG
    pdf_data = Column(LargeBinary)  # Cached PDF
    
    # Compliance check results
    compliance_status = Column(String(20), default="pending")  # pending, passed, failed
    compliance_issues = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="labels")
    template = relationship("Template", back_populates="labels")
