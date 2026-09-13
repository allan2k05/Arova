import sys
from PIL import Image, ImageDraw

def render_logo(size=512):
    # Create image with dark background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = int(size * 0.05)
    rect_box = [pad, pad, size - pad, size - pad]
    corner_radius = int(size * 0.16)
    bg_color = (13, 14, 18, 255) # Dark charcoal background
    gold_color = (224, 165, 57, 255) # #e0a539 gold

    # Outer rounded rectangle fill & stroke
    border_w = max(2, int(size * 0.03))
    draw.rounded_rectangle(rect_box, radius=corner_radius, fill=bg_color, outline=gold_color, width=border_w)

    # Corner brackets (L shapes inside)
    b_len = int(size * 0.12)
    b_off = int(size * 0.15)
    stroke_w = max(2, int(size * 0.035))

    # Top-Left Bracket
    draw.line([(b_off, b_off + b_len), (b_off, b_off), (b_off + b_len, b_off)], fill=gold_color, width=stroke_w)
    # Top-Right Bracket
    draw.line([(size - b_off - b_len, b_off), (size - b_off, b_off), (size - b_off, b_off + b_len)], fill=gold_color, width=stroke_w)
    # Bottom-Left Bracket
    draw.line([(b_off, size - b_off - b_len), (b_off, size - b_off), (b_off + b_len, size - b_off)], fill=gold_color, width=stroke_w)
    # Bottom-Right Bracket
    draw.line([(size - b_off - b_len, size - b_off), (size - b_off, size - b_off), (size - b_off, size - b_off - b_len)], fill=gold_color, width=stroke_w)

    # Waveform Pulse Line points
    # (21% -> 79% width, centered vertically at 50%)
    pts = [
        (int(size * 0.21), int(size * 0.50)),
        (int(size * 0.30), int(size * 0.50)),
        (int(size * 0.38), int(size * 0.26)),
        (int(size * 0.44), int(size * 0.74)),
        (int(size * 0.51), int(size * 0.32)),
        (int(size * 0.58), int(size * 0.63)),
        (int(size * 0.64), int(size * 0.42)),
        (int(size * 0.70), int(size * 0.55)),
        (int(size * 0.79), int(size * 0.50)),
    ]

    wave_w = max(2, int(size * 0.038))
    for i in range(len(pts) - 1):
        draw.line([pts[i], pts[i+1]], fill=gold_color, width=wave_w, joint="curve")

    return img

if __name__ == "__main__":
    high_res = render_logo(512)
    
    # Save PNGs
    high_res.save("public/icon.png")
    high_res.resize((180, 180), Image.Resampling.LANCZOS).save("public/apple-touch-icon.png")
    high_res.resize((192, 192), Image.Resampling.LANCZOS).save("public/icon-192.png")
    high_res.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-512.png")

    # Save multi-size ICO files for app/favicon.ico and public/favicon.ico
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)]
    ico_imgs = [high_res.resize(s, Image.Resampling.LANCZOS) for s in sizes]
    
    ico_imgs[0].save("app/favicon.ico", format="ICO", sizes=sizes, append_images=ico_imgs[1:])
    ico_imgs[0].save("public/favicon.ico", format="ICO", sizes=sizes, append_images=ico_imgs[1:])
    print("Successfully generated all favicon and icon assets!")
