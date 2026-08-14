import type { Level } from '../lib/reading-logic';

interface StoryNode {
  text: string;
  question: string;
  choices: { label: string; nextNodeId: string }[];
}

interface Story {
  id: string;
  topic: string;
  level: string;
  nodes: Record<string, StoryNode>;
}

// Fetch stories lazily from public/ — keeps them out of the JS bundle entirely.
let _storiesPromise: Promise<Story[]> | null = null;

function loadStories(): Promise<Story[]> {
  if (!_storiesPromise) {
    _storiesPromise = fetch('/stories.json')
      .then(r => r.json())
      .catch(() => []);
  }
  return _storiesPromise;
}

export async function getStoriesForLevel(level: Level): Promise<Story[]> {
  const stories = await loadStories();
  return stories.filter(s => s.level.toLowerCase() === level.toLowerCase());
}

export async function getRandomStory(level: Level): Promise<Story | null> {
  const levelStories = await getStoriesForLevel(level);
  if (levelStories.length === 0) return null;
  return levelStories[Math.floor(Math.random() * levelStories.length)];
}

export async function getStoryById(id: string): Promise<Story | undefined> {
  const stories = await loadStories();
  return stories.find(s => s.id === id);
}

export async function getAllStoryTopics(): Promise<{ topic: string; level: string }[]> {
  const stories = await loadStories();
  return stories.map(s => ({ topic: s.topic, level: s.level }));
}
