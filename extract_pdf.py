from pdfminer.high_level import extract_text

try:
    text = extract_text("ASI - TRABAJO DE INVESTIGACION - Grupo 6_VERSION-ULTIMA.pdf")
    with open("pdf_content_utf8.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Success")
except Exception as e:
    with open("pdf_error.txt", "w", encoding="utf-8") as f:
        f.write(str(e))
