package com.solventek.silverwind.chat;

import java.lang.reflect.Field;
import java.util.List;
import java.util.ArrayList;

/**
 * Utility to convert List of DTOs/objects to Markdown table format.
 * Used by AI tools to return structured data to the chatbot.
 */
public class TableGenerator {

    public static String toMarkdownTable(List<?> list) {
        if (list == null || list.isEmpty()) {
            return "No records found.";
        }

        Object first = list.get(0);

        // Handle Strings and Primitives
        if (isSimple(first)) {
            StringBuilder sb = new StringBuilder();
            sb.append("| Item |\n");
            sb.append("| --- |\n");
            for (Object o : list) {
                sb.append("| ").append(o.toString()).append(" |\n");
            }
            return sb.toString();
        }

        // Handle Objects (DTOs)
        try {
            // Get fields
            Field[] fields = first.getClass().getDeclaredFields();
            // Filter out synthetic or unwanted fields if any (usually simple DTOs are fine)
            List<Field> validFields = new ArrayList<>();
            for (Field f : fields) {
                if (!f.isSynthetic()) {
                    f.setAccessible(true);
                    validFields.add(f);
                }
            }

            if (validFields.isEmpty()) {
                return list.toString(); // Fallback
            }

            StringBuilder sb = new StringBuilder();

            // Header
            sb.append("|");
            for (Field f : validFields) {
                sb.append(" ").append(formatHeader(f.getName())).append(" |");
            }
            sb.append("\n");

            // Separator
            sb.append("|");
            for (int i = 0; i < validFields.size(); i++) {
                sb.append(" --- |");
            }
            sb.append("\n");

            // Rows
            for (Object row : list) {
                sb.append("|");
                for (Field f : validFields) {
                    Object val = f.get(row);
                    sb.append(" ").append(val != null ? val.toString().replace("|", "\\|") : "").append(" |");
                }
                sb.append("\n");
            }

            return sb.toString();

        } catch (Exception e) {
            return "Error formatting table: " + e.getMessage();
        }
    }

    private static boolean isSimple(Object o) {
        return o instanceof String || o instanceof Number || o instanceof Boolean;
    }

    private static String formatHeader(String camelCase) {
        // "firstName" -> "First Name"
        if (camelCase == null || camelCase.isEmpty())
            return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < camelCase.length(); i++) {
            char c = camelCase.charAt(i);
            if (i == 0) {
                sb.append(Character.toUpperCase(c));
            } else if (Character.isUpperCase(c)) {
                sb.append(" ").append(c);
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
