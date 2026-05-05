"""
PDF Service - Handles PDF generation for customers
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from datetime import datetime
import io
import os


class PDFService:
    """Service for PDF generation"""
    
    # Default page size and margins
    PAGE_SIZE = letter  # (8.5, 11) inches
    MARGIN = 0.5 * inch
    
    def __init__(self):
        """Initialize PDF service"""
        self.styles = getSampleStyleSheet()
        self._add_custom_styles()
    
    def _add_custom_styles(self):
        """Add custom paragraph styles"""
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            fontName='Helvetica-Bold'
        ))
        
        # Subheader style
        self.styles.add(ParagraphStyle(
            name='CustomSubHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#333333'),
            spaceAfter=6,
            fontName='Helvetica'
        ))
    
    def generate_letterhead_pdf(self, customer):
        """
        Generate a letterhead PDF for a customer
        
        Args:
            customer (dict): Customer data with fields like name, email, phone, address, etc.
            
        Returns:
            bytes: PDF content as bytes, or None if generation fails
        """
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=self.PAGE_SIZE,
                rightMargin=self.MARGIN,
                leftMargin=self.MARGIN,
                topMargin=self.MARGIN,
                bottomMargin=self.MARGIN
            )
            
            # Build content
            elements = []
            
            # Company/Letterhead Header (you can customize this)
            header_text = "<b>COMPANY LETTERHEAD</b>"
            elements.append(Paragraph(header_text, self.styles['CustomHeader']))
            elements.append(Spacer(1, 0.3 * inch))
            
            # Date
            date_text = f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}"
            elements.append(Paragraph(date_text, self.styles['CustomBody']))
            elements.append(Spacer(1, 0.2 * inch))
            
            # Recipient Information
            elements.append(Paragraph("<b>To:</b>", self.styles['CustomSubHeader']))
            
            recipient_info = f"""
            <br/>
            {customer.get('name', 'N/A')}<br/>
            {customer.get('position', '')}<br/>
            {customer.get('company', '')}<br/>
            {customer.get('address', '')}<br/>
            {customer.get('city', '')}, {customer.get('state', '')} {customer.get('zip_code', '')}<br/>
            {customer.get('country', '')}<br/>
            """
            elements.append(Paragraph(recipient_info, self.styles['CustomBody']))
            elements.append(Spacer(1, 0.2 * inch))
            
            # Contact Information Table
            contact_data = [
                ['Email:', customer.get('email', 'N/A')],
                ['Phone:', customer.get('phone', 'N/A')],
                ['Company:', customer.get('company', 'N/A')],
                ['Website:', customer.get('website', 'N/A')],
                ['Industry:', customer.get('industry', 'N/A')],
            ]
            
            contact_table = Table(contact_data, colWidths=[1.5*inch, 4*inch])
            contact_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            
            elements.append(contact_table)
            elements.append(Spacer(1, 0.3 * inch))
            
            # Additional Notes
            if customer.get('notes'):
                elements.append(Paragraph("<b>Notes:</b>", self.styles['CustomSubHeader']))
                notes_text = customer.get('notes', '').replace('\n', '<br/>')
                elements.append(Paragraph(notes_text, self.styles['CustomBody']))
            
            elements.append(Spacer(1, 0.4 * inch))
            
            # Footer
            footer_text = "<i>Generated on: {}</i>".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            elements.append(Paragraph(footer_text, self.styles['Normal']))
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF bytes
            buffer.seek(0)
            return buffer.getvalue()
        
        except Exception as e:
            print(f"Error generating letterhead PDF: {str(e)}")
            return None
    
    def generate_cover_pdf(self, customer, title="Customer Information Cover"):
        """
        Generate a cover page PDF for a customer
        
        Args:
            customer (dict): Customer data
            title (str): Title for the cover page
            
        Returns:
            bytes: PDF content as bytes, or None if generation fails
        """
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=self.PAGE_SIZE,
                rightMargin=self.MARGIN,
                leftMargin=self.MARGIN,
                topMargin=self.MARGIN,
                bottomMargin=self.MARGIN
            )
            
            # Build content
            elements = []
            
            # Spacer for vertical centering
            elements.append(Spacer(1, 2 * inch))
            
            # Title
            title_text = f"<b>{title}</b>"
            elements.append(Paragraph(title_text, self.styles['CustomHeader']))
            
            elements.append(Spacer(1, 1 * inch))
            
            # Customer Name (Large)
            name_style = ParagraphStyle(
                name='LargeName',
                parent=self.styles['Normal'],
                fontSize=28,
                textColor=colors.HexColor('#1a1a1a'),
                spaceAfter=20,
                fontName='Helvetica-Bold',
                alignment=1  # Center alignment
            )
            elements.append(Paragraph(customer.get('name', 'N/A'), name_style))
            
            # Company
            if customer.get('company'):
                company_style = ParagraphStyle(
                    name='CompanyText',
                    parent=self.styles['Normal'],
                    fontSize=16,
                    textColor=colors.HexColor('#666666'),
                    spaceAfter=10,
                    fontName='Helvetica',
                    alignment=1  # Center alignment
                )
                elements.append(Paragraph(customer.get('company'), company_style))
            
            # Position
            if customer.get('position'):
                position_style = ParagraphStyle(
                    name='PositionText',
                    parent=self.styles['Normal'],
                    fontSize=14,
                    textColor=colors.HexColor('#888888'),
                    spaceAfter=30,
                    fontName='Helvetica-Oblique',
                    alignment=1  # Center alignment
                )
                elements.append(Paragraph(customer.get('position'), position_style))
            
            elements.append(Spacer(1, 0.5 * inch))
            
            # Quick Info
            quick_info = f"""
            <b>Contact Information</b><br/>
            Email: {customer.get('email', 'N/A')}<br/>
            Phone: {customer.get('phone', 'N/A')}<br/>
            Status: {customer.get('status', 'N/A')}
            """
            
            info_style = ParagraphStyle(
                name='QuickInfo',
                parent=self.styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#333333'),
                spaceAfter=10,
                fontName='Helvetica',
                alignment=1  # Center alignment
            )
            elements.append(Paragraph(quick_info, info_style))
            
            # Spacer
            elements.append(Spacer(1, 1.5 * inch))
            
            # Footer with date
            footer_text = f"<i>Generated: {datetime.now().strftime('%B %d, %Y')}</i>"
            footer_style = ParagraphStyle(
                name='FooterText',
                parent=self.styles['Normal'],
                fontSize=9,
                textColor=colors.HexColor('#999999'),
                alignment=1  # Center alignment
            )
            elements.append(Paragraph(footer_text, footer_style))
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF bytes
            buffer.seek(0)
            return buffer.getvalue()
        
        except Exception as e:
            print(f"Error generating cover PDF: {str(e)}")
            return None
    
    def generate_customer_report_pdf(self, customer):
        """
        Generate a comprehensive customer report PDF
        
        Args:
            customer (dict): Customer data
            
        Returns:
            bytes: PDF content as bytes, or None if generation fails
        """
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=self.PAGE_SIZE,
                rightMargin=self.MARGIN,
                leftMargin=self.MARGIN,
                topMargin=self.MARGIN,
                bottomMargin=self.MARGIN
            )
            
            # Build content
            elements = []
            
            # Title
            elements.append(Paragraph("Customer Information Report", self.styles['CustomHeader']))
            elements.append(Spacer(1, 0.2 * inch))
            
            # Customer Details Table
            details_data = [
                ['Name:', customer.get('name', 'N/A')],
                ['Email:', customer.get('email', 'N/A')],
                ['Phone:', customer.get('phone', 'N/A')],
                ['Company:', customer.get('company', 'N/A')],
                ['Position:', customer.get('position', 'N/A')],
                ['Industry:', customer.get('industry', 'N/A')],
                ['Status:', customer.get('status', 'N/A')],
            ]
            
            details_table = Table(details_data, colWidths=[1.5*inch, 4.5*inch])
            details_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#d3d3d3')),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#f9f9f9')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            
            elements.append(details_table)
            elements.append(Spacer(1, 0.3 * inch))
            
            # Address Section
            elements.append(Paragraph("Address Information", self.styles['CustomSubHeader']))
            
            address_data = [
                ['Street:', customer.get('address', 'N/A')],
                ['City:', customer.get('city', 'N/A')],
                ['State:', customer.get('state', 'N/A')],
                ['Zip Code:', customer.get('zip_code', 'N/A')],
                ['Country:', customer.get('country', 'N/A')],
                ['Website:', customer.get('website', 'N/A')],
            ]
            
            address_table = Table(address_data, colWidths=[1.5*inch, 4.5*inch])
            address_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#d3d3d3')),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#f9f9f9')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            
            elements.append(address_table)
            elements.append(Spacer(1, 0.3 * inch))
            
            # Notes Section
            if customer.get('notes'):
                elements.append(Paragraph("Additional Notes", self.styles['CustomSubHeader']))
                notes_text = customer.get('notes', '').replace('\n', '<br/>')
                elements.append(Paragraph(notes_text, self.styles['CustomBody']))
            
            # Footer
            elements.append(Spacer(1, 0.3 * inch))
            footer_text = "<i>Report generated on: {}</i>".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            elements.append(Paragraph(footer_text, self.styles['Normal']))
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF bytes
            buffer.seek(0)
            return buffer.getvalue()
        
        except Exception as e:
            print(f"Error generating customer report PDF: {str(e)}")
            return None
