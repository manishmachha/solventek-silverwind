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
 * Features ultra-premium styling, ATS-friendly formatting, and image watermark.
 */
@Service
@Slf4j
public class BrandedResumePdfService {

    // Premium Color Palette
    private static final Color BRAND_PRIMARY = new Color(17, 24, 39); // Deep Slate
    private static final Color BRAND_ACCENT = new Color(37, 99, 235); // Modern Blue #2563eb
    private static final Color BRAND_LIGHT = new Color(239, 246, 255); // Very light blue
    private static final Color TEXT_DARK = new Color(31, 41, 55); // Gray 800
    private static final Color TEXT_MUTED = new Color(107, 114, 128); // Gray 500
    private static final Color BORDER_LIGHT = new Color(229, 231, 235); // Gray 200
    private static final Color WHITE = Color.WHITE;

    // Fonts - OpenPDF built-in
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 28, Font.BOLD, BRAND_PRIMARY);
    private static final Font CONTACT_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, TEXT_MUTED);
    private static final Font SECTION_TITLE_FONT = new Font(Font.HELVETICA, 14, Font.BOLD, BRAND_ACCENT);
    private static final Font CARD_TITLE_FONT = new Font(Font.HELVETICA, 12, Font.BOLD, TEXT_DARK);
    private static final Font CARD_SUBTITLE_FONT = new Font(Font.HELVETICA, 11, Font.ITALIC, BRAND_ACCENT);
    private static final Font DATE_FONT = new Font(Font.HELVETICA, 10, Font.BOLD, TEXT_MUTED);
    private static final Font BODY_FONT = new Font(Font.HELVETICA, 10, Font.NORMAL, TEXT_DARK);
    private static final Font BODY_ITALIC = new Font(Font.HELVETICA, 10, Font.ITALIC, TEXT_MUTED);
    private static final Font SKILL_FONT = new Font(Font.HELVETICA, 9, Font.BOLD, BRAND_PRIMARY);
    private static final Font FOOTER_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);

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
        log.info("Generating premium branded resume PDF for: {}", candidateName);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, baos);
            writer.setPageEvent(new PremiumPageEvent());
            doc.open();

            // === HEADER ===
            addHeader(doc, candidateName, email, phone, location);
            doc.add(new Paragraph(" ", BODY_FONT)); // Spacing

            // === SUMMARY ===
            if (summary != null && !summary.isBlank()) {
                addSectionTitle(doc, "PROFESSIONAL SUMMARY");
                Paragraph p = new Paragraph(summary, BODY_FONT);
                p.setSpacingAfter(15);
                p.setLeading(14f);
                doc.add(p);
            }

            // === SKILLS (Top level for impact) ===
            if (skills != null && !skills.isEmpty()) {
                addSectionTitle(doc, "CORE COMPETENCIES");
                addSkills(doc, skills);
            }

            // === EXPERIENCE ===
            if (experience != null && !experience.isEmpty()) {
                addSectionTitle(doc, "PROFESSIONAL EXPERIENCE");
                for (Map<String, Object> exp : experience) {
                    addExperienceCard(doc, exp);
                }
            }

            // === PROJECTS ===
            if (projects != null && !projects.isEmpty()) {
                addSectionTitle(doc, "KEY INITIATIVES & PROJECTS");
                for (Map<String, Object> proj : projects) {
                    addProjectCard(doc, proj);
                }
            }

            // === EDUCATION ===
            if (education != null && !education.isEmpty()) {
                addSectionTitle(doc, "EDUCATION");
                for (Map<String, Object> edu : education) {
                    addEducationCard(doc, edu);
                }
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate premium branded resume PDF", e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    private void addHeader(Document doc, String name, String email, String phone, String location)
            throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[] { 65, 35 });

        // Left: Name & Logo
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(PdfPCell.NO_BORDER);
        leftCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        try {
            Image logo1 = Image
                    .getInstance(getClass().getClassLoader().getResource("logos/Solventek_logo_compact.png"));
            logo1.scaleToFit(38, 38);

            Image logo2 = Image.getInstance(getClass().getClassLoader().getResource("logos/solventek_logo_text.png"));
            logo2.scaleToFit(140, 38);

            Paragraph logoP = new Paragraph();
            // Use Chunk to perfectly align images inline with a fixed horizontal gap
            Chunk c1 = new Chunk(logo1, 0, -8, true);
            Chunk c2 = new Chunk(logo2, 0, -8, true);

            logoP.add(c1);
            logoP.add(new Chunk("    ")); // 4 spaces for a clean gap
            logoP.add(c2);
            logoP.setSpacingAfter(15);

            leftCell.addElement(logoP);
        } catch (Exception e) {
            log.warn("Logos not found", e);
            Paragraph fallback = new Paragraph("SOLVENTEK", new Font(Font.HELVETICA, 16, Font.BOLD, BRAND_ACCENT));
            fallback.setSpacingAfter(15);
            leftCell.addElement(fallback);
        }

        if (name != null) {
            Paragraph nameP = new Paragraph(name.toUpperCase(), HEADER_FONT);
            leftCell.addElement(nameP);
        }
        headerTable.addCell(leftCell);

        // Right: Contact info
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.setVerticalAlignment(Element.ALIGN_BOTTOM);

        Paragraph contactP = new Paragraph();
        contactP.setAlignment(Element.ALIGN_RIGHT);
        contactP.setLeading(14f);

        if (email != null)
            contactP.add(new Chunk(email + "\n", CONTACT_FONT));
        if (phone != null)
            contactP.add(new Chunk(phone + "\n", CONTACT_FONT));
        if (location != null)
            contactP.add(new Chunk(location, CONTACT_FONT));

        rightCell.addElement(contactP);
        headerTable.addCell(rightCell);

        // Bottom divider below header
        PdfPCell dividerCell = new PdfPCell();
        dividerCell.setColspan(2);
        dividerCell.setBorder(PdfPCell.BOTTOM);
        dividerCell.setBorderWidthBottom(1f);
        dividerCell.setBorderColorBottom(BORDER_LIGHT);
        dividerCell.setPaddingTop(10f);
        headerTable.addCell(dividerCell);

        doc.add(headerTable);
    }

    private void addSectionTitle(Document doc, String title) throws DocumentException {
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        divider.setSpacingBefore(15);
        divider.setSpacingAfter(10);

        PdfPCell divCell = new PdfPCell();
        divCell.setBorder(PdfPCell.BOTTOM);
        divCell.setBorderWidthBottom(2f);
        divCell.setBorderColorBottom(BRAND_ACCENT);
        divCell.setPaddingBottom(4f);
        divCell.setPhrase(new Phrase(title, SECTION_TITLE_FONT));

        divider.addCell(divCell);
        doc.add(divider);
    }

    private void addExperienceCard(Document doc, Map<String, Object> exp) throws DocumentException {
        String title = safeStr(exp, "title");
        String company = safeStr(exp, "company");
        String start = safeStr(exp, "start");
        String end = safeStr(exp, "end");
        String desc = safeStr(exp, "description");

        PdfPTable card = new PdfPTable(1);
        card.setWidthPercentage(100);
        card.setSpacingAfter(12);
        card.setSplitLate(false); // Fixes large vertical gaps; splits immediately if it doesn't fit

        PdfPCell cell = new PdfPCell();
        cell.setBorder(PdfPCell.LEFT);
        cell.setBorderWidthLeft(3f);
        cell.setBorderColorLeft(BRAND_LIGHT);
        cell.setPaddingLeft(12f);
        cell.setPaddingBottom(5f);

        // Header Row (Title | Company Date)
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[] { 70, 30 });

        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(PdfPCell.NO_BORDER);
        Paragraph titleP = new Paragraph(title, CARD_TITLE_FONT);
        if (company != null && !company.isBlank()) {
            titleP.add(new Chunk(" | " + company, CARD_SUBTITLE_FONT));
        }
        titleCell.addElement(titleP);

        PdfPCell dateCell = new PdfPCell();
        dateCell.setBorder(PdfPCell.NO_BORDER);
        dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        String dateRange = (start != null ? start : "") + " — " + (end != null ? end : "Present");
        Paragraph dateP = new Paragraph(dateRange, DATE_FONT);
        dateP.setAlignment(Element.ALIGN_RIGHT);
        dateCell.addElement(dateP);

        headerTable.addCell(titleCell);
        headerTable.addCell(dateCell);

        cell.addElement(headerTable);

        // Add a small spacer
        Paragraph spacer = new Paragraph(" ", new Font(Font.HELVETICA, 4));
        cell.addElement(spacer);

        if (desc != null && !desc.isBlank()) {
            com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED, 10f);
            list.setListSymbol(new Chunk("• ", BODY_FONT));

            String[] bullets = desc.split("\\n");
            for (String bullet : bullets) {
                String cleanBullet = bullet.trim();
                // Strip existing literal dash or bullet if the AI added it
                if (cleanBullet.startsWith("-") || cleanBullet.startsWith("•") || cleanBullet.startsWith("*")) {
                    cleanBullet = cleanBullet.substring(1).trim();
                }
                if (!cleanBullet.isBlank()) {
                    ListItem item = new ListItem(cleanBullet, BODY_FONT);
                    item.setSpacingAfter(4f);
                    item.setLeading(14f);
                    list.add(item);
                }
            }
            cell.addElement(list);
        }

        card.addCell(cell);
        doc.add(card);
    }

    private void addProjectCard(Document doc, Map<String, Object> proj) throws DocumentException {
        String name = safeStr(proj, "name");
        String desc = safeStr(proj, "description");
        Object stackObj = proj.get("stack");

        PdfPTable card = new PdfPTable(1);
        card.setWidthPercentage(100);
        card.setSpacingAfter(12);
        card.setSplitLate(false);

        PdfPCell cell = new PdfPCell();
        cell.setBorder(PdfPCell.LEFT);
        cell.setBorderWidthLeft(3f);
        cell.setBorderColorLeft(BRAND_ACCENT);
        cell.setPaddingLeft(12f);
        cell.setPaddingBottom(5f);

        Paragraph titleP = new Paragraph(name != null ? name : "Project", CARD_TITLE_FONT);
        titleP.setSpacingAfter(6);
        cell.addElement(titleP);

        if (desc != null && !desc.isBlank()) {
            com.lowagie.text.List list = new com.lowagie.text.List(com.lowagie.text.List.UNORDERED, 10f);
            list.setListSymbol(new Chunk("• ", BODY_FONT));

            String[] bullets = desc.split("\\n");
            for (String bullet : bullets) {
                String cleanBullet = bullet.trim();
                if (cleanBullet.startsWith("-") || cleanBullet.startsWith("•") || cleanBullet.startsWith("*")) {
                    cleanBullet = cleanBullet.substring(1).trim();
                }
                if (!cleanBullet.isBlank()) {
                    ListItem item = new ListItem(cleanBullet, BODY_FONT);
                    item.setSpacingAfter(4f);
                    item.setLeading(14f);
                    list.add(item);
                }
            }
            cell.addElement(list);
        }

        if (stackObj instanceof java.util.List<?> stack && !stack.isEmpty()) {
            String stackStr = "Technologies: " + String.join(", ", stack.stream().map(Object::toString).toList());
            Paragraph stackP = new Paragraph(stackStr, BODY_ITALIC);
            stackP.setSpacingBefore(6);
            cell.addElement(stackP);
        }
        card.addCell(cell);
        doc.add(card);
    }

    private void addEducationCard(Document doc, Map<String, Object> edu) throws DocumentException {
        String institution = safeStr(edu, "institution");
        String degree = safeStr(edu, "degree");
        String field = safeStr(edu, "fieldOfStudy");
        String startYear = safeStr(edu, "startYear");
        String endYear = safeStr(edu, "endYear");

        PdfPTable card = new PdfPTable(2);
        card.setWidthPercentage(100);
        card.setWidths(new float[] { 75, 25 });
        card.setSpacingAfter(10);
        card.setSplitLate(false);

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(PdfPCell.NO_BORDER);

        String degreeText = (degree != null ? degree : "") + (field != null ? " in " + field : "");
        Paragraph degP = new Paragraph(degreeText, CARD_TITLE_FONT);
        leftCell.addElement(degP);

        if (institution != null && !institution.isBlank()) {
            Paragraph instP = new Paragraph(institution, CARD_SUBTITLE_FONT);
            instP.setSpacingBefore(2);
            leftCell.addElement(instP);
        }
        card.addCell(leftCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(PdfPCell.NO_BORDER);
        String years = (startYear != null ? startYear : "") + " — " + (endYear != null ? endYear : "");
        Paragraph yearsP = new Paragraph(years, DATE_FONT);
        yearsP.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(yearsP);
        card.addCell(rightCell);

        doc.add(card);
    }

    private void addSkills(Document doc, java.util.List<String> skills) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);
        table.setWidths(new float[] { 25, 25, 25, 25 });

        for (String skill : skills) {
            PdfPCell cell = new PdfPCell(new Phrase(skill, SKILL_FONT));
            cell.setBackgroundColor(BRAND_LIGHT);
            cell.setPaddingTop(5f);
            cell.setPaddingBottom(7f);
            cell.setBorderWidth(1f);
            cell.setBorderColor(WHITE); // White border acts as inner margin
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(cell);
        }

        int remainder = skills.size() % 4;
        if (remainder != 0) {
            for (int i = 0; i < 4 - remainder; i++) {
                PdfPCell empty = new PdfPCell();
                empty.setBorder(PdfPCell.NO_BORDER);
                table.addCell(empty);
            }
        }
        doc.add(table);
    }

    private String safeStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString().trim() : null;
    }

    private static class PremiumPageEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte canvas = writer.getDirectContentUnder();

            // Image Watermark
            try {
                Image watermark = Image
                        .getInstance(getClass().getClassLoader().getResource("logos/Solventek_logo_compact.png"));
                // Extremely subtle image watermark in the center
                float width = 400f;
                float height = watermark.getScaledHeight() * (width / watermark.getScaledWidth());
                watermark.scaleToFit(width, height);
                watermark.setAbsolutePosition(
                        (document.getPageSize().getWidth() - width) / 2,
                        (document.getPageSize().getHeight() - height) / 2);
                // Based on user request, orient horizontally instead of diagonally
                watermark.setRotationDegrees(0f);

                canvas.saveState();
                PdfGState gs = new PdfGState();
                gs.setFillOpacity(0.04f); // Very faint
                canvas.setGState(gs);
                canvas.addImage(watermark);
                canvas.restoreState();
            } catch (Exception e) {
                // Ignore watermark errors silently
            }

            // High-end Footer
            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();

            // Draw a subtle line above footer
            cb.setColorStroke(BORDER_LIGHT);
            cb.setLineWidth(1f);
            cb.moveTo(document.left(), document.bottom() - 10);
            cb.lineTo(document.right(), document.bottom() - 10);
            cb.stroke();

            Phrase leftFooter = new Phrase("Solventek Exec Search  |  Confidential", FOOTER_FONT);
            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, leftFooter,
                    document.left(), document.bottom() - 25, 0);

            Phrase rightFooter = new Phrase("Page " + writer.getPageNumber(), FOOTER_FONT);
            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, rightFooter,
                    document.right(), document.bottom() - 25, 0);

            cb.restoreState();
        }
    }
}
