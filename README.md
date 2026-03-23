# Snake Game

A browser-based snake game built with plain HTML, CSS, and JavaScript.

## Features

- 35x35 game board
- High score saved in `localStorage`
- Speed increases by 10% every 5 points
- Big bonus food appears after every 5 regular foods
- Big food pulses, lasts a few seconds, and gives `+5` score
- Sound effects for start, food, big food, miss, and game over

## Files

- `index.html` - page structure
- `style.css` - page and canvas styling
- `snake.js` - game logic

## Play Locally

Open `index.html` in your browser.

## Controls

- `Start` to begin a round
- `Pause` to stop the game
- Arrow keys to move the snake

## GitHub Pages

This project is ready to deploy on GitHub Pages.

1. Push this folder to the GitHub repo:

```bash
git add .
git commit -m "Initial GitHub Pages deploy"
git push -u origin master
```

2. In GitHub, open the repository settings.
3. Go to `Pages`.
4. Set `Source` to `Deploy from a branch`.
5. Select branch `master` and folder `/(root)`.
6. Save.

Expected live URL:

```text
https://jaggudada01.github.io/snake_game/
```

## Notes

- Audio files must stay in the project root so the sound paths continue to work.
- High score is stored per browser, not globally online.
