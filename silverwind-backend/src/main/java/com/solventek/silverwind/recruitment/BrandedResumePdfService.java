package com.solventek.silverwind.recruitment;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

/**
 * Generates professionally branded PDF resumes using OpenPDF.
 * Uses Solventek brand colors and layout with watermark.
 */
@Service
@Slf4j
public class BrandedResumePdfService {

    // Brand colors
    private static final Color BRAND_PRIMARY = new Color(26, 35, 126); // Deep blue #1a237e
    private static final Color BRAND_ACCENT = new Color(48, 63, 159); // Indigo #303f9f
    private static final Color BRAND_LIGHT = new Color(197, 202, 233); // Light indigo #c5cae9
    private static final Color TEXT_DARK = new Color(33, 33, 33);
    private static final Color TEXT_SECONDARY = new Color(117, 117, 117);
    private static final Color SECTION_BG = new Color(232, 234, 246); // Very light indigo
    private static final Color WHITE = Color.WHITE;

    // Fonts
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 22, Font.BOLD, WHITE);
    private static final Font NAME_FONT = new Font(Font.HELVETICA, 18, Font.BOLD, WHITE);
    private static final Font CONTACT_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL, BRAND_LIGHT);
    private static final Font SECTION_TITLE_FONT = new Font(Font.HELVETICA, 13, Font.BOLD, BRAND_PRIMARY);
    private static final Font SUBTITLE_FONT = new Font(Font.HELVETICA, 11, Font.BOLD, TEXT_DARK);
    private static final Font BODY_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, TEXT_DARK);
    private static final Font BODY_ITALIC = new Font(Font.HELVETICA, 10, Font.ITALIC, TEXT_SECONDARY);
    private static final Font SKILL_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL, BRAND_PRIMARY);
    private static final Font FOOTER_FONT = new Font(Font.HELVETICA, 8, Font.ITALIC, TEXT_SECONDARY);

    /**
     * Generate a branded PDF resume from structured data.
     *
     * @param candidateName Full name
     * @param email         Contact email
     * @param phone         Phone number (nullable)
     * @param location      City/location (nullable)
     * @param summary       Professional summary
     * @param experience    List of experience maps with keys: company, title,
     *                      start, end, description
     * @param education     List of education maps with keys: institution, degree,
     *                      fieldOfStudy, startYear, endYear
     * @param skills        List of skill names
     * @param projects      List of project maps with keys: name, description, stack
     * @return PDF as byte array
     */
    public byte[] generate(
            String candidateName,
            String email,
            String phone,
            String location,
            String summary,
            List<Map<String, Object>> experience,
            List<Map<String, Object>> education,
            List<String> skills,
            List<Map<String, Object>> projects) {
        log.info("Generating branded resume PDF for: {}", candidateName);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document doc = new Document(PageSize.A4, 40, 40, 30, 40);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, baos);
            writer.setPageEvent(new BrandedPageEvent());
            doc.open();

            // === HEADER BAR ===
            addHeader(doc, candidateName, email, phone, location);

            doc.add(Chunk.NEWLINE);

            // === SUMMARY ===
            if (summary != null && !summary.isBlank()) {
                addSectionTitle(doc, "PROFESSIONAL SUMMARY");
                Paragraph p = new Paragraph(summary, BODY_FONT);
                p.setSpacingAfter(10);
                doc.add(p);
            }

            // === EXPERIENCE ===
            if (experience != null && !experience.isEmpty()) {
                addSectionTitle(doc, "PROFESSIONAL EXPERIENCE");
                for (Map<String, Object> exp : experience) {
                    addExperience(doc, exp);
                }
            }

            // === EDUCATION ===
            if (education != null && !education.isEmpty()) {
                addSectionTitle(doc, "EDUCATION");
                for (Map<String, Object> edu : education) {
                    addEducation(doc, edu);
                }
            }

            // === SKILLS ===
            if (skills != null && !skills.isEmpty()) {
                addSectionTitle(doc, "TECHNICAL SKILLS");
                addSkills(doc, skills);
            }

            // === PROJECTS ===
            if (projects != null && !projects.isEmpty()) {
                addSectionTitle(doc, "KEY PROJECTS");
                for (Map<String, Object> proj : projects) {
                    addProject(doc, proj);
                }
            }

            doc.close();
            log.info("Branded resume PDF generated: {} bytes", baos.size());

        } catch (Exception e) {
            log.error("Failed to generate branded resume PDF", e);
            throw new RuntimeException("PDF generation failed", e);
        }

        return baos.toByteArray();
    }

    private void addHeader(Document doc, String name, String email, String phone, String location)
            throws DocumentException {
        // Header table with brand color background
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);

        PdfPCell headerCell = new PdfPCell();
        headerCell.setBackgroundColor(BRAND_PRIMARY);
        headerCell.setPadding(20);
        headerCell.setBorder(PdfPCell.NO_BORDER);

        // Company branding (Image Logo)
        try {
            Image logo = Image.getInstance(
                    getClass().getClassLoader()
                            .getResource("logos/Solventek_logo_compressed.png"));
            logo.scaleToFit(150, 40); // Adjust size as needed
            logo.setSpacingAfter(8);
            headerCell.addElement(logo);
        } catch (Exception e) {
            log.warn("Could not load Solventek logo image, falling back to text", e);
            Paragraph branding = new Paragraph("SOLVENTEK", HEADER_FONT);
            branding.setSpacingAfter(8);
            headerCell.addElement(branding);
        }

        // Candidate name
        if (name != null) {
            Paragraph nameP = new Paragraph(name, NAME_FONT);
            nameP.setSpacingAfter(5);
            headerCell.addElement(nameP);
        }

        // Contact info line
        StringBuilder contact = new StringBuilder();
        if (email != null)
            contact.append(email);
        if (phone != null) {
            if (!contact.isEmpty())
                contact.append("  |  ");
            contact.append(phone);
        }
        if (location != null) {
            if (!contact.isEmpty())
                contact.append("  |  ");
            contact.append(location);
        }
        if (!contact.isEmpty()) {
            Paragraph contactP = new Paragraph(contact.toString(), CONTACT_FONT);
            headerCell.addElement(contactP);
        }

        headerTable.addCell(headerCell);
        doc.add(headerTable);
    }

    private void addSectionTitle(Document doc, String title) throws DocumentException {
        // Divider line
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        divider.setSpacingBefore(12);
        PdfPCell divCell = new PdfPCell();
        divCell.setBorderWidthTop(2);
        divCell.setBorderColorTop(BRAND_ACCENT);
        divCell.setBorderWidthBottom(0);
        divCell.setBorderWidthLeft(0);
        divCell.setBorderWidthRight(0);
        divCell.setPaddingTop(6);
        divCell.setPhrase(new Phrase(title, SECTION_TITLE_FONT));
        divider.addCell(divCell);
        doc.add(divider);
    }

    private void addExperience(Document doc, Map<String, Object> exp) throws DocumentException {
        String title = safeStr(exp, "title");
        String company = safeStr(exp, "company");
        String start = safeStr(exp, "start");
        String end = safeStr(exp, "end");
        String desc = safeStr(exp, "description");

        // Title + Company row
        PdfPTable row = new PdfPTable(2);
        row.setWidthPercentage(100);
        row.setWidths(new float[] { 70, 30 });
        row.setSpacingBefore(6);

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(PdfPCell.NO_BORDER);
        Paragraph titleP = new Paragraph(title, SUBTITLE_FONT);
        if (company != null && !company.isBlank()) {
            titleP.add(new Chunk(" at " + company, BODY_ITALIC));
        }
        leftCell.addElement(titleP);
        row.addCell(leftCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        String dateRange = (start != null ? start : "") + " — " + (end != null ? end : "Present");
        Paragraph dateP = new Paragraph(dateRange, BODY_ITALIC);
        dateP.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(dateP);
        row.addCell(rightCell);

        doc.add(row);

        // Description
        if (desc != null && !desc.isBlank()) {
            Paragraph descP = new Paragraph(desc, BODY_FONT);
            descP.setIndentationLeft(10);
            descP.setSpacingAfter(6);
            doc.add(descP);
        }
    }

    private void addEducation(Document doc, Map<String, Object> edu) throws DocumentException {
        String institution = safeStr(edu, "institution");
        String degree = safeStr(edu, "degree");
        String field = safeStr(edu, "fieldOfStudy");
        String startYear = safeStr(edu, "startYear");
        String endYear = safeStr(edu, "endYear");

        PdfPTable row = new PdfPTable(2);
        row.setWidthPercentage(100);
        row.setWidths(new float[] { 70, 30 });
        row.setSpacingBefore(4);

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(PdfPCell.NO_BORDER);
        String degreeText = (degree != null ? degree : "") + (field != null ? " in " + field : "");
        Paragraph degP = new Paragraph(degreeText, SUBTITLE_FONT);
        leftCell.addElement(degP);
        if (institution != null && !institution.isBlank()) {
            leftCell.addElement(new Paragraph(institution, BODY_FONT));
        }
        row.addCell(leftCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(PdfPCell.NO_BORDER);
        String years = (startYear != null ? startYear : "") + " — " + (endYear != null ? endYear : "");
        Paragraph yearsP = new Paragraph(years, BODY_ITALIC);
        yearsP.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(yearsP);
        row.addCell(rightCell);

        doc.add(row);
    }

    private void addSkills(Document doc, List<String> skills) throws DocumentException {
        // Skills as a wrapped grid of chip-like cells
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setSpacingBefore(4);
        table.setSpacingAfter(8);

        for (String skill : skills) {
            PdfPCell cell = new PdfPCell(new Phrase(skill, SKILL_FONT));
            cell.setBackgroundColor(SECTION_BG);
            cell.setPadding(6);
            cell.setBorderWidth(0.5f);
            cell.setBorderColor(BRAND_LIGHT);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        // Fill remaining cells in the last row
        int remainder = skills.size() % 5;
        if (remainder != 0) {
            for (int i = 0; i < 5 - remainder; i++) {
                PdfPCell emptyCell = new PdfPCell(new Phrase(""));
                emptyCell.setBorder(PdfPCell.NO_BORDER);
                table.addCell(emptyCell);
            }
        }

        doc.add(table);
    }

    private void addProject(Document doc, Map<String, Object> proj) throws DocumentException {
        String name = safeStr(proj, "name");
        String desc = safeStr(proj, "description");
        Object stackObj = proj.get("stack");

        Paragraph projP = new Paragraph(name != null ? name : "Project", SUBTITLE_FONT);
        projP.setSpacingBefore(4);
        doc.add(projP);

        if (desc != null && !desc.isBlank()) {
            Paragraph descP = new Paragraph(desc, BODY_FONT);
            descP.setIndentationLeft(10);
            doc.add(descP);
        }

        if (stackObj instanceof List<?> stack && !stack.isEmpty()) {
            String stackStr = "Tech: " + String.join(", ", stack.stream().map(Object::toString).toList());
            Paragraph stackP = new Paragraph(stackStr, BODY_ITALIC);
            stackP.setIndentationLeft(10);
            stackP.setSpacingAfter(4);
            doc.add(stackP);
        }
    }

    private String safeStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    /**
     * Page event handler for watermark and footer.
     */
    private static class BrandedPageEvent extends PdfPageEventHelper {

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte canvas = writer.getDirectContentUnder();

            // Watermark — diagonal "SOLVENTEK"
            canvas.saveState();
            PdfGState gs = new PdfGState();
            gs.setFillOpacity(0.06f);
            canvas.setGState(gs);
            canvas.setColorFill(BRAND_PRIMARY);
            canvas.beginText();
            BaseFont bf;
            try {
                bf = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            } catch (Exception e) {
                return;
            }
            canvas.setFontAndSize(bf, 72);
            canvas.showTextAligned(Element.ALIGN_CENTER, "SOLVENTEK",
                    297.5f, 421, 45);
            canvas.endText();
            canvas.restoreState();

            // Footer
            PdfContentByte cb = writer.getDirectContent();
            Phrase footer = new Phrase(
                    "Prepared by Solventek  •  Confidential  •  Page " + writer.getPageNumber(),
                    FOOTER_FONT);
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, footer,
                    (document.right() - document.left()) / 2 + document.leftMargin(),
                    document.bottom() - 15, 0);
        }
    }
}
