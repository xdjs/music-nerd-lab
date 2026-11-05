from pathlib import Path
import re,base64
root=Path(__file__).resolve().parents[1]
html=(root/'dist/index.html').read_text()
js=next((root/'dist/assets').glob('*.js')).read_text()
css=next((root/'dist/assets').glob('*.css')).read_text()
logo='data:image/png;base64,'+base64.b64encode((root/'public/music-nerd.png').read_bytes()).decode()
js=js.replace('/music-nerd.png',logo)
wordmark='data:image/png;base64,'+base64.b64encode((root/'public/music-nerd-wordmark.png').read_bytes()).decode()
js=js.replace('/music-nerd-wordmark.png',wordmark)
js=js.replace('/lens-preview.webp','data:image/webp;base64,'+base64.b64encode((root/'public/lens-preview.webp').read_bytes()).decode())
for kind in ['sequencer','chords','tempo']:
 js=js.replace('/'+kind+'-preview.webp','data:image/webp;base64,'+base64.b64encode((root/'public'/f'{kind}-preview.webp').read_bytes()).decode())
font='data:font/ttf;base64,'+base64.b64encode((root/'public/BarlowCondensed-Bold.ttf').read_bytes()).decode()
css=css.replace('/BarlowCondensed-Bold.ttf',font)
html=re.sub(r'<script type="module"[^>]*></script>',lambda _: '<script>'+js.replace('</script','<\\/script')+'</script>',html)
# Execute after root is present.
script=re.search(r'<script>.*?</script>',html,re.S).group()
html=html.replace(script,'').replace('</body>',script+'</body>')
html=re.sub(r'<link rel="stylesheet"[^>]*>',lambda _: '<style>'+css+'</style>',html)
html=html.replace('/music-nerd.png',logo)
(root/'review.html').write_text(html)
(root/'review-phone.html').write_text('''<!doctype html><html><head><meta charset="utf-8"><title>Music Nerd Apps — 390px review</title><style>body{margin:0;background:#e6e6e6;display:flex;justify-content:center}iframe{border:0;width:390px;height:844px;background:white;margin:25px 0;box-shadow:0 10px 40px #0003}</style></head><body><iframe src="review.html" title="Music Nerd Apps at 390 pixels"></iframe></body></html>''')
print('Built review.html and review-phone.html')
