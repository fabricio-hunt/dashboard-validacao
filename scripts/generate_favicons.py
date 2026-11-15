import os
from PIL import Image, ImageDraw, ImageFilter

def create_favicon_assets():
    os.makedirs('public', exist_ok=True)
    os.makedirs('app', exist_ok=True)

    # 1. Generate favicon.svg
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066F5" />
      <stop offset="50%" stop-color="#004FC7" />
      <stop offset="100%" stop-color="#002D80" />
    </linearGradient>

    <linearGradient id="emeraldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00B875" />
      <stop offset="100%" stop-color="#00F5A0" />
    </linearGradient>

    <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#00143A" flood-opacity="0.35" />
    </filter>

    <filter id="glowAccent" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#00F5A0" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Inner border highlight -->
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity="0.18" />

  <!-- Medical Cross Group with Shadow -->
  <g filter="url(#softShadow)">
    <!-- Vertical Cross Bar -->
    <rect x="206" y="106" width="100" height="300" rx="24" fill="#FFFFFF" />
    <!-- Horizontal Cross Bar -->
    <rect x="106" y="206" width="300" height="100" rx="24" fill="#FFFFFF" />
  </g>

  <!-- Central Stock Analytics Motif: Ascending Stock Pillars in Emerald -->
  <g filter="url(#glowAccent)">
    <rect x="222" y="258" width="16" height="28" rx="6" fill="url(#emeraldGrad)" />
    <rect x="248" y="238" width="16" height="48" rx="6" fill="url(#emeraldGrad)" />
    <rect x="274" y="218" width="16" height="68" rx="6" fill="url(#emeraldGrad)" />
    <circle cx="282" cy="204" r="7" fill="#00F5A0" />
  </g>
</svg>'''

    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open('app/icon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("Saved public/favicon.svg and app/icon.svg")

    # 2. Render high-res master with Pillow (2048x2048 supersampled)
    canvas_size = 2048
    scale = canvas_size / 512.0
    
    # Create base image with gradient
    base = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # Draw linear gradient on base squircle mask
    # Color stops: #0066F5 -> #004FC7 -> #002D80
    grad_img = Image.new('RGBA', (canvas_size, canvas_size))
    for y in range(canvas_size):
        t = y / (canvas_size - 1)
        if t < 0.5:
            # Interpolate #0066F5 (0, 102, 245) to #004FC7 (0, 79, 199)
            local_t = t * 2.0
            r = int(0 * (1 - local_t) + 0 * local_t)
            g = int(102 * (1 - local_t) + 79 * local_t)
            b = int(245 * (1 - local_t) + 199 * local_t)
        else:
            # Interpolate #004FC7 (0, 79, 199) to #002D80 (0, 45, 128)
            local_t = (t - 0.5) * 2.0
            r = int(0 * (1 - local_t) + 0 * local_t)
            g = int(79 * (1 - local_t) + 45 * local_t)
            b = int(199 * (1 - local_t) + 128 * local_t)
        for x in range(canvas_size):
            grad_img.putpixel((x, y), (r, g, b, 255))
    
    mask = Image.new('L', (canvas_size, canvas_size), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=int(112 * scale), fill=255)
    
    base.paste(grad_img, (0, 0), mask)
    
    draw = ImageDraw.Draw(base)
    # Inner border highlight
    border_inset = int(8 * scale)
    draw.rounded_rectangle(
        [border_inset, border_inset, canvas_size - border_inset - 1, canvas_size - border_inset - 1],
        radius=int(104 * scale),
        outline=(255, 255, 255, 46),
        width=int(4 * scale)
    )

    # Shadow for medical cross
    shadow_layer = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle(
        [int(206 * scale), int(106 * scale), int((206 + 100) * scale), int((106 + 300) * scale)],
        radius=int(24 * scale),
        fill=(0, 20, 58, 120)
    )
    s_draw.rounded_rectangle(
        [int(106 * scale), int(206 * scale), int((106 + 300) * scale), int((206 + 100) * scale)],
        radius=int(24 * scale),
        fill=(0, 20, 58, 120)
    )
    # Blur shadow
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=int(16 * scale)))
    base.alpha_composite(shadow_layer, (0, int(8 * scale)))

    # Medical cross in pure white
    cross_layer = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(cross_layer)
    c_draw.rounded_rectangle(
        [int(206 * scale), int(106 * scale), int((206 + 100) * scale), int((106 + 300) * scale)],
        radius=int(24 * scale),
        fill=(255, 255, 255, 255)
    )
    c_draw.rounded_rectangle(
        [int(106 * scale), int(206 * scale), int((106 + 300) * scale), int((206 + 100) * scale)],
        radius=int(24 * scale),
        fill=(255, 255, 255, 255)
    )
    base.alpha_composite(cross_layer)

    # Stock bars in emerald
    stock_layer = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    st_draw = ImageDraw.Draw(stock_layer)
    
    emerald_color = (0, 229, 163, 255) # vibrant emerald green
    
    # Bar 1 (left)
    st_draw.rounded_rectangle(
        [int(222 * scale), int(258 * scale), int((222 + 16) * scale), int((258 + 28) * scale)],
        radius=int(6 * scale),
        fill=emerald_color
    )
    # Bar 2 (center)
    st_draw.rounded_rectangle(
        [int(248 * scale), int(238 * scale), int((248 + 16) * scale), int((238 + 48) * scale)],
        radius=int(6 * scale),
        fill=emerald_color
    )
    # Bar 3 (right)
    st_draw.rounded_rectangle(
        [int(274 * scale), int(218 * scale), int((274 + 16) * scale), int((218 + 68) * scale)],
        radius=int(6 * scale),
        fill=emerald_color
    )
    # Circle peak dot
    dot_r = int(7 * scale)
    dot_cx = int(282 * scale)
    dot_cy = int(204 * scale)
    st_draw.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=emerald_color
    )
    
    base.alpha_composite(stock_layer)

    # Export multi-res PNGs
    sizes = {
        'public/icon-512.png': 512,
        'public/icon-192.png': 192,
        'public/apple-touch-icon.png': 180,
        'public/favicon-32x32.png': 32,
        'public/favicon-16x16.png': 16,
    }

    for path, sz in sizes.items():
        res = base.resize((sz, sz), Image.Resampling.LANCZOS)
        res.save(path, 'PNG')
        print(f"Generated {path} ({sz}x{sz})")

    # Generate multi-size favicon.ico (16, 32, 48, 64)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    base.save('public/favicon.ico', format='ICO', sizes=ico_sizes)
    base.save('app/favicon.ico', format='ICO', sizes=ico_sizes)
    print("Generated public/favicon.ico and app/favicon.ico with multi-resolution sizes [16, 32, 48, 64]")

if __name__ == '__main__':
    create_favicon_assets()
