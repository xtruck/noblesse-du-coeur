"""Fabrique les images d'aperçu du lien (WhatsApp, Facebook, Google…) : 1200 × 630 px.
   Usage : python outils/apercus.py   (depuis la racine du site). Polices : Georgia (Windows).
   Sorties : img/apercu-accueil.jpg (les deux logos + titre) et img/apercu-ong.jpg (logo de l'ONG)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1200, 630
VERT, VERT_FONCE, OR, OR_TEXTE, CREME, ENCRE = (20, 71, 47), (12, 46, 31), (184, 148, 63), (122, 92, 23), (250, 246, 234), (23, 36, 28)
ORANGE, BLANC, VERT_CI = (247, 127, 0), (255, 255, 255), (0, 158, 96)
F = "C:/Windows/Fonts/"

def police(nom, taille):
    for essai in (nom, "georgia.ttf"):
        try: return ImageFont.truetype(F + essai, taille)
        except OSError: pass
    return ImageFont.load_default()

def fond():
    im = Image.new("RGB", (W, H), CREME); d = ImageDraw.Draw(im)
    for y in range(H):                                   # léger dégradé crème → sable
        t = y / H; d.line([(0, y), (W, y)], fill=tuple(int(CREME[i] * (1 - t) + (241, 234, 214)[i] * t) for i in range(3)))
    d.rectangle([0, 0, W // 3, 12], fill=ORANGE); d.rectangle([W // 3, 0, 2 * W // 3, 12], fill=BLANC); d.rectangle([2 * W // 3, 0, W, 12], fill=VERT_CI)   # bandeau tricolore
    d.rectangle([0, H - 96, W, H], fill=VERT_FONCE)
    d.rectangle([0, H - 96, W, H - 92], fill=OR)
    return im

def logo(nom, hauteur):
    l = Image.open("img/" + nom).convert("RGBA"); r = hauteur / l.height
    return l.resize((round(l.width * r), hauteur), Image.LANCZOS)

def coller(im, l, x, y):
    ombre = Image.new("RGBA", l.size, (0, 0, 0, 0)); ombre.putalpha(l.getchannel("A").point(lambda v: int(v * .28)))
    ombre = ombre.filter(ImageFilter.GaussianBlur(10)); im.paste(ombre, (x + 4, y + 10), ombre); im.paste(l, (x, y), l)

def centre(d, texte, f, y, x0, x1, fill):
    w = d.textlength(texte, font=f); d.text((x0 + (x1 - x0 - w) / 2, y), texte, font=f, fill=fill)

# ---------------- accueil : les deux logos + titre ----------------
def ajuste(d, texte, nom, taille, largeur_max):
    """réduit la taille de la police jusqu'à ce que le texte tienne dans la largeur disponible"""
    while taille > 20 and d.textlength(texte, font=police(nom, taille)) > largeur_max: taille -= 2
    return police(nom, taille), taille

im = fond(); d = ImageDraw.Draw(im)
bmt, ong = logo("logo_bmt-480.webp", 215), logo("logo_lueur-480.webp", 215)
x = 50; coller(im, bmt, x, 165); x += bmt.width + 26
d.line([(x, 185), (x, 365)], fill=OR, width=3); x += 26
coller(im, ong, x, 165)
gauche = x + ong.width + 55; dispo = W - 50 - gauche
f1, t = ajuste(d, "La Noblesse du Cœur", "georgiab.ttf", 70, dispo); f2 = police("georgiaz.ttf", t)
d.text((gauche, 130), "La Noblesse du ", font=f1, fill=VERT); d.text((gauche + d.textlength("La Noblesse du ", font=f1), 130), "Cœur", font=f2, fill=OR_TEXTE)
d.text((gauche, 130 + t + 16), "L'art de la politesse", font=police("georgiai.ttf", 34), fill=OR_TEXTE)
y = 130 + t + 16 + 62
d.line([(gauche, y), (gauche + 110, y)], fill=OR, width=4)
d.text((gauche, y + 22), "Évaluation en ligne", font=police("georgiab.ttf", 32), fill=ENCRE)
d.text((gauche, y + 68), "Cours, auto-évaluations corrigées", font=police("georgia.ttf", 26), fill=ENCRE)
d.text((gauche, y + 104), "et examens finaux", font=police("georgia.ttf", 26), fill=ENCRE)
centre(d, "BMT Green Academy  ×  ONG Lueur d'Espoir  ·  Côte d'Ivoire", police("georgiab.ttf", 31), H - 66, 0, W, CREME)
im.save("img/apercu-accueil.jpg", "JPEG", quality=88, optimize=True, progressive=True)

# ---------------- ONG : le logo de l'ONG ----------------
im = fond(); d = ImageDraw.Draw(im)
ong = logo("logo_lueur-480.webp", 340); coller(im, ong, 90, 110)
gauche = 90 + ong.width + 70
d.text((gauche, 120), "ONG", font=police("georgiab.ttf", 44), fill=OR_TEXTE)
d.text((gauche, 170), "Lueur d'Espoir", font=police("georgiab.ttf", 78), fill=VERT)
d.line([(gauche, 270), (gauche + 120, 270)], fill=OR, width=4)
d.text((gauche, 292), "Redonner espoir, révéler les potentiels,", font=police("georgiai.ttf", 31), fill=OR_TEXTE)
d.text((gauche, 336), "transformer durablement les communautés.", font=police("georgiai.ttf", 31), fill=OR_TEXTE)
d.text((gauche, 410), "Dignité humaine · Inclusion sociale · Paix", font=police("georgia.ttf", 25), fill=ENCRE)
d.text((gauche, 446), "Leadership positif · Engagement citoyen", font=police("georgia.ttf", 25), fill=ENCRE)
centre(d, "+225 01 01 73 68 12  ·  Aidez-nous à nous aider", police("georgiab.ttf", 31), H - 66, 0, W, CREME)
im.save("img/apercu-ong.jpg", "JPEG", quality=88, optimize=True, progressive=True)

for n in ("img/apercu-accueil.jpg", "img/apercu-ong.jpg"):
    print(n, Image.open(n).size, os.path.getsize(n) // 1024, "Ko")
