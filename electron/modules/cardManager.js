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

export async function createCard(deckPath, front, back, imagePath = null, cardType = 'default', options = null) {
  const cards = await listCards(deckPath)
  const nextId = String(cards.length + 1).padStart(3, '0')
  
  const metadata = {
    id: nextId,
    created: new Date().toISOString(),
    tags: [],
    difficulty: 'medium',
    type: cardType || 'default'
  }
  
  if (cardType === 'multiple-choice' && options && Array.isArray(options)) {
    metadata.options = options
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
  
  if (updates.metadata?.type && updates.metadata.type !== 'multiple-choice') {
    delete updatedMetadata.options
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
  const normalizedContent = content.replace(/^\uFEFF/, '')
  const lines = normalizedContent.split('\n')
  const metadata = {}
  let frontContent = []
  let backContent = []
  let currentSection = null
  let inMetadata = false
  let allowMetadataStart = true

  const isDelimiter = (s) => {
    const cleaned = s.replace(/\uFEFF/g, '').replace(/\u200B/g, '').trim()
    return /^-{3,}$/.test(cleaned)
  }
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\uFEFF/g, '')
    const trimmed = line.trim()
    
    if (isDelimiter(trimmed)) {
      if (!inMetadata && allowMetadataStart) {
        inMetadata = true
        continue
      } else if (inMetadata) {
        inMetadata = false
        continue
      }
    }
    
    if (inMetadata) {
      const match = trimmed.match(/^([\w-]+):\s*(.*)$/)
      if (match) {
        const key = match[1].toLowerCase()
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

    if (!inMetadata && trimmed !== '') {
      allowMetadataStart = false
    }
    
    if (trimmed === '# Front') {
      currentSection = 'front'
      continue
    }
    
    if (trimmed === '# Back') {
      currentSection = 'back'
      continue
    }
    
    if (currentSection === 'front') {
      frontContent.push(line)
    } else if (currentSection === 'back') {
      backContent.push(line)
    }
  }

  if (Object.keys(metadata).length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].replace(/\uFEFF/g, '').trim()
      if (trimmed === '# Front' || trimmed === '# Back') break
      if (isDelimiter(trimmed) || trimmed === '') continue
      const match = trimmed.match(/^([\w-]+):\s*(.*)$/)
      if (match) {
        const key = match[1].toLowerCase()
        let value = match[2].trim()
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value)
          } catch {
            value = []
          }
        }
        if (!(key in metadata)) {
          metadata[key] = value
        }
      }
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

  const normalizedMetadata = { ...metadata }
  normalizedMetadata.id = normalizedMetadata.id || cardId
  normalizedMetadata.created = normalizedMetadata.created || new Date().toISOString()
  if (typeof normalizedMetadata.type === 'string' && normalizedMetadata.type.trim()) {
    normalizedMetadata.type = normalizedMetadata.type.trim().toLowerCase()
  } else {
    normalizedMetadata.type = 'default'
  }
  
  return {
    id: cardId,
    front,
    back,
    image,
    metadata: normalizedMetadata,
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
    `type: ${metadata.type || 'default'}`
  ]
  
  if (metadata.options && Array.isArray(metadata.options)) {
    metadataLines.push(`options: ${JSON.stringify(metadata.options)}`)
  }
  
  metadataLines.push('---', '')
  
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

