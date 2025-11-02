import fs from 'fs/promises'
import path from 'path'

export async function listCards(deckPath) {
  const entries = await fs.readdir(deckPath, { withFileTypes: true })
  const cardFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'deck.json')
    .sort((a, b) => a.name.localeCompare(b.name))
  
  const cards = []
  
  for (const file of cardFiles) {
    const cardPath = path.join(deckPath, file.name)
    const content = await fs.readFile(cardPath, 'utf-8')
    const card = parseCardMarkdown(content, file.name)
    cards.push(card)
  }
  
  return cards
}

export async function getCard(deckPath, cardId) {
  const cardPath = path.join(deckPath, `${cardId}.md`)
  const content = await fs.readFile(cardPath, 'utf-8')
  return parseCardMarkdown(content, `${cardId}.md`)
}

export async function createCard(deckPath, front, back, imagePath = null) {
  const cards = await listCards(deckPath)
  const nextId = String(cards.length + 1).padStart(3, '0')
  
  const metadata = {
    id: nextId,
    created: new Date().toISOString(),
    tags: [],
    difficulty: 'medium'
  }
  
  let imageMarkdown = ''
  if (imagePath) {
    const imageFileName = path.basename(imagePath)
    const assetsDir = path.join(deckPath, 'assets')
    const targetImagePath = path.join(assetsDir, imageFileName)
    
    await fs.copyFile(imagePath, targetImagePath)
    imageMarkdown = `\n\n![](assets/${imageFileName})`
  }
  
  const markdownContent = generateCardMarkdown(metadata, front, back, imageMarkdown)
  
  const cardPath = path.join(deckPath, `${nextId}.md`)
  await fs.writeFile(cardPath, markdownContent, 'utf-8')
  
  await updateDeckCardCount(deckPath)
  
  return parseCardMarkdown(markdownContent, `${nextId}.md`)
}

export async function updateCard(deckPath, cardId, updates) {
  const cardPath = path.join(deckPath, `${cardId}.md`)
  const content = await fs.readFile(cardPath, 'utf-8')
  const card = parseCardMarkdown(content, `${cardId}.md`)
  
  const updatedMetadata = {
    ...card.metadata,
    ...updates.metadata
  }
  
  const front = updates.front !== undefined ? updates.front : card.front
  const back = updates.back !== undefined ? updates.back : card.back
  
  let imageMarkdown = ''
  if (updates.imagePath === null) {
    imageMarkdown = ''
  } else if (updates.imagePath) {
    const imageFileName = path.basename(updates.imagePath)
    const assetsDir = path.join(deckPath, 'assets')
    const targetImagePath = path.join(assetsDir, imageFileName)
    
    await fs.copyFile(updates.imagePath, targetImagePath)
    imageMarkdown = `\n\n![](assets/${imageFileName})`
  } else if (card.image) {
    imageMarkdown = `\n\n![](${card.image})`
  }
  
  const markdownContent = generateCardMarkdown(updatedMetadata, front, back, imageMarkdown)
  await fs.writeFile(cardPath, markdownContent, 'utf-8')
  
  return parseCardMarkdown(markdownContent, `${cardId}.md`)
}

export async function deleteCard(deckPath, cardId) {
  const cardPath = path.join(deckPath, `${cardId}.md`)
  await fs.unlink(cardPath)
  
  await updateDeckCardCount(deckPath)
  
  return { success: true, cardId }
}

export async function updateCardFromMarkdown(deckPath, cardId, markdownContent) {
  const cardPath = path.join(deckPath, `${cardId}.md`)
  await fs.writeFile(cardPath, markdownContent, 'utf-8')
  
  return parseCardMarkdown(markdownContent, `${cardId}.md`)
}

function parseCardMarkdown(content, fileName) {
  const lines = content.split('\n')
  const metadata = {}
  let frontContent = []
  let backContent = []
  let currentSection = null
  let inMetadata = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.trim() === '---') {
      if (!inMetadata && i === 0) {
        inMetadata = true
        continue
      } else if (inMetadata) {
        inMetadata = false
        continue
      }
    }
    
    if (inMetadata) {
      const match = line.match(/^(\w+):\s*(.+)$/)
      if (match) {
        const key = match[1]
        let value = match[2].trim()
        
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value)
          } catch (e) {
            value = []
          }
        }
        
        metadata[key] = value
      }
      continue
    }
    
    if (line.trim() === '# Front') {
      currentSection = 'front'
      continue
    }
    
    if (line.trim() === '# Back') {
      currentSection = 'back'
      continue
    }
    
    if (currentSection === 'front') {
      frontContent.push(line)
    } else if (currentSection === 'back') {
      backContent.push(line)
    }
  }
  
  const front = frontContent.join('\n').trim()
  let back = backContent.join('\n').trim()
  
  const imageMatch = back.match(/!\[.*?\]\((.*?)\)/)
  const image = imageMatch ? imageMatch[1] : null
  
  if (image) {
    back = back.replace(/!\[.*?\]\(.*?\)/g, '').trim()
  }
  
  const cardId = path.basename(fileName, '.md')
  
  return {
    id: cardId,
    front,
    back,
    image,
    metadata,
    fileName
  }
}

function generateCardMarkdown(metadata, front, back, imageMarkdown = '') {
  const metadataLines = [
    '---',
    `id: ${metadata.id}`,
    `created: ${metadata.created}`,
    `tags: ${JSON.stringify(metadata.tags || [])}`,
    `difficulty: ${metadata.difficulty || 'medium'}`,
    '---',
    ''
  ]
  
  const content = [
    ...metadataLines,
    '# Front',
    '',
    front,
    '',
    '# Back',
    '',
    back,
    imageMarkdown
  ]
  
  return content.join('\n').trim() + '\n'
}

async function updateDeckCardCount(deckPath) {
  const metadataPath = path.join(deckPath, 'deck.json')
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'))
  
  const cards = await listCards(deckPath)
  
  metadata.cardCount = cards.length
  metadata.modified = new Date().toISOString()
  
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
}

