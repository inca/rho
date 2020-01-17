import fs from 'fs';
import path from 'path';
import glob from 'glob';

export const codeFiles = glob.sync('src/**/*.ts', {
    cwd: process.cwd(),
});

export const words = `
Lorsque j'avais six ans j'ai vu une fois
une magnifique image dans un livre sur la
Forêt Vièrge qui s'appelait Histoires Vecues.
Ça représentait une serpent boa qui avalait un fauve.
`
    .split(/\s+/)
    .map(_ => _.trim().replace(/[\.,]/g, '').toLowerCase())
    .filter(Boolean);

export function generateTextFile(file: string) {
    const buf: string[] = [];
    buf.push(generateHeading(1, 1));
    for (let i = 0; i < 10; i++) {
        buf.push(generateParagraph(5, 10, 5, 20));
    }
    for (let i = 0; i < 100; i++) {
        buf.push(generateHeading(2, 4));
        for (let j = 0; j < 5; j++) {
            buf.push(generateParagraph(3, 15, 5, 20));
        }
        buf.push(generateCode(5, 50));
    }
    fs.writeFileSync(file, buf.join('\n\n'), 'utf-8');
}

export function randomFrom<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

export function randomWord() {
    return randomFrom(words);
}

export function capitalize(str: string) {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
}

export function randomInt(min: number, max: number) {
    return Math.round(Math.random() * (max - min)) + min;
}

export function generateSentence(words: number) {
    const buffer: string[] = [];
    for (let i = 0; i < words; i++) {
        buffer.push(randomWord());
    }
    buffer[0] = capitalize(buffer[0]);
    return buffer.join(' ') + '.';
}

export function generateParagraph(sentMin: number, sentMax: number, wordsMin: number, wordsMax: number) {
    const buffer: string[] = [];
    const s = randomInt(sentMin, sentMax);
    for (let i = 0; i < s; i++) {
        const w = randomInt(wordsMin, wordsMax);
        let sentence = generateSentence(w);
        if (i === 0 && Math.random() > .75) {
            // Add selector
            sentence = sentence + '    {.style}\n';
        }
        buffer.push(sentence);
    }
    return buffer.join(' ');
}

export function generateCode(linesMin: number, linesMax: number) {
    const file = randomFrom(codeFiles);
    const txt = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
    const lines = txt.split('\n');
    const l = randomInt(linesMin, linesMax);
    const i = randomInt(0, lines.length - l);
    const indent = ' '.repeat(randomInt(0, 4));
    return indent + '``` {.ts}\n' +
        lines.slice(i, i + l).map(l => indent + l).join('\n') + '\n' +
        indent + '```\n';
}

export function generateHeading(minLevel: number, maxLevel: number) {
    const level = randomInt(minLevel, maxLevel);
    const marker = '#'.repeat(level);
    return marker + ' ' + generateParagraph(1, 1, 12, 15);
}
