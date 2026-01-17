This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## DreamIT stroke animation notes

- Color: update `STROKE_COLOR` in [app/components/WriteAnimation.tsx](app/components/WriteAnimation.tsx#L10-L12) to change the stroke hue for the SVG handwriting.
- SVG source: [public/vectorized.svg](public/vectorized.svg). Path 0 is the outer frame (skipped in animation). Paths 1-12 are the strokes used for the word.
- Stroke mapping (after removing the frame), aligned to D → r → e → a → m → I → T → dot:
	- D outer: index 2 (bbox ~x148-272, y442-582); D inner: index 9 (x157-258, y451-573)
	- r: index 5 (x289-353, y483-581)
	- e: index 3 (x349-454, y481-583) plus e inner index 4 (x367-443, y487-530)
	- a: index 0 (x467-562, y480-583) plus a inner index 1 (x478-554, y487-576)
	- m: index 7 (x586-718, y479-581)
	- I stem: index 6 (x746-755, y440-581)
	- T bar+stem: index 8 (x775-876, y442-581)
	- i-dot: index 10 outer (x679-722, y425-466) and 11 inner (x698-704, y444-450)
- The animation order array lives in [app/components/WriteAnimation.tsx](app/components/WriteAnimation.tsx#L50-L60) as `dreamItOrder = [2, 9, 5, 3, 4, 0, 1, 7, 6, 8, 10, 11]`; edit there if the SVG changes.
- You can set precise per-path durations two ways:
	- Edit the defaults inside `WriteAnimation` at `DEFAULT_PATH_OVERRIDES`.
	- Or pass a `durationsOverride` prop to the `WriteAnimation` component (a `Record<number, number>` mapping path-index → milliseconds).

Example override mapping (ms):
```
{ 2: 1400, 9: 900, 3: 1100, 4: 700 }
```
This lets you slow the `D` and `e` strokes explicitly without changing the SVG.

You can also set small overlaps so the next stroke starts slightly before the previous finishes.
Defaults live in `WriteAnimation` as `DEFAULT_PATH_OVERLAPS`. Example:
```
{ 9: 400, 4: 350 }
```
This shortens the pause after path `9` (D inner) and after path `4` (e inner).
Currently overlaps are disabled for debugging. Previous working set (before applying `SPEED_FACTOR`): `{ 9: 1500, 4: 900, 1: 800 }` — with `SPEED_FACTOR = 3` that becomes `{ 9: 4500, 4: 2700, 1: 2400 }`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
