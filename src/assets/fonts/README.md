# Fonts

JetBrains Mono Nerd Font Mono ([Nerd Fonts v3.5.1](https://github.com/ryanoasis/nerd-fonts/releases/tag/v3.5.1)), licensed under the OFL (`OFL.txt`).

The files were subset (from ~1 MB down to ~65 KB each) to the characters the app can display:
Latin with diacritics, Greek, Cyrillic, punctuation, arrows, box drawing and blocks. No Nerd icons are used.
To regenerate from the original:

```sh
pip install fonttools brotli
pyftsubset JetBrainsMonoNerdFontMono-Regular.ttf --flavor=woff2 --layout-features='*' \
  --unicodes="U+0020-007E,U+00A0-024F,U+0300-036F,U+0370-03FF,U+0400-04FF,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+2500-259F,U+25A0-25FF,U+2605-2606" \
  --output-file=JetBrainsMonoNerdFontMono-Regular.woff2
```
