import { chromium } from 'playwright'

async function main() {
  console.log('Launching browser...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const sites = [
    { name: 'San Isidro', url: 'https://www.sanisidro.gob.ar' },
    { name: 'La Plata', url: 'https://www.laplata.gob.ar' },
    { name: 'Tigre', url: 'https://www.tigre.gob.ar' },
    { name: 'Ameghino', url: 'https://www.ameghino.gob.ar' },
  ]

  for (const site of sites) {
    console.log(`\nTesting ${site.name} (${site.url})...`)
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(2000)
      const title = await page.title()
      const text = await page.evaluate(() => document.body?.innerText?.substring(0, 200) || 'NO BODY')
      console.log(`  Title: ${title}`)
      console.log(`  Content: ${text.replace(/\n/g, ' ').substring(0, 150)}...`)
    } catch (err) {
      console.log(`  ERROR: ${(err as Error).message}`)
    }
  }

  await browser.close()
  console.log('\nDone.')
}

main()
