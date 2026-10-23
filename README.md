# Bartender booking site

A one-page site for getting hired to bartend: rate, experience, ABC licence, an at-a-glance profile, and a booking form that emails each request.

It's plain HTML. No build step and nothing to install.

## Make it yours (5 minutes)

1. **Your details:** open `config.js` and fill in your name, the email that should get booking requests, and your ABC licence number, issuer and expiry date. Every page element reads from that file.
2. **Your photo:** add a portrait photo to this folder named `photo.jpg`. It shows in the hero and on the profile card. Until you add one, the page shows "Photo coming soon".
3. **Turn on booking emails:** submit one test request from the live site. FormSubmit sends a one-time "Activate form" email to the address in `config.js`. Click it, and every request after that arrives in your inbox as a table.
   - To keep your real email out of the page source, FormSubmit's activation email also gives you a random alias string. Paste that into `email` in place of your address.
4. **Optional:** add a Calendly/Cal.com link (`calendarLink`), your Instagram, or a scan of your certificate (`abc.proof`).

## Styles

The site comes in 10 variations on one dark cocktail-bar look: Cocktail Bar (the default), Negroni, Absinthe, Midnight Martini, Bourbon, Champagne Noir, Tiki Torch, Velvet Lounge, Mezcal Smoke and Rosé Last Call.

- While choosing, the **Style** button in the bottom corner flips between them. Every switch updates the address, so a link like `…/?style=disco` opens straight into that look.
- To lock one in: set `style` in `config.js` to its id and `showStylePicker` to `false`.
- The layout is `base.css` and the shared bar look (light, bokeh, grain, glowing glass) is `bar.css`. Each variant is one small file in `themes/` that sets its colours and fonts, and the list lives in `themes.js`.

## Put it online (GitHub Pages, free)

GitHub Pages needs the repo to be **public** on a free plan:

```bash
gh repo edit --visibility public --accept-visibility-change-consequences
gh api -X POST repos/{owner}/{repo}/pages -f "source[branch]=main" -f "source[path]=/"
```

The site appears at `https://<username>.github.io/<repo>/` after a minute or two.

## The fun bits

- **Music:** a lo-fi loop, generated live in the browser (no audio file, no licensing). It plays quietly and starts on the visitor's first tap or key press, since browsers block sound before that. The Music button turns it off, and the choice is remembered.
- **Logo:** click the cocktail glass for a random anime reaction or a bar fact. It's a hidden extra, so nothing on the page points to it.
- **Check availability** on the profile card jumps to the booking form.

## Preview locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.
