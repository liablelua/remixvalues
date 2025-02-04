import './globals.css'

export const metadata = {
  title: 'Assassin Remix! Value List',
  description: 'Spreadsheet no more, easier way to update and make values!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}