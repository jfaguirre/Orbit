import fs from 'node:fs';
import path from 'node:path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} from 'docx';

const mdPath = path.resolve('DOCUMENTACION_ACTIVIDAD.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

const lines = mdContent.split(/\r?\n/);
const children = [];

// Portada / Encabezado
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: '“Academia de Tecnología Creativa”',
        bold: true,
        size: 32,
        color: '1A365D',
      }),
    ],
    spacing: { after: 200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Formación académica: “AI for Devs Jr.” — Código: AIDJR3',
        size: 24,
        color: '4A5568',
      }),
    ],
    spacing: { after: 150 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Coach: Ing. Ronald Magia',
        size: 22,
        color: '4A5568',
      }),
    ],
    spacing: { after: 150 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Estudiante: Juan Francisco Aguirre Aparicio',
        bold: true,
        size: 24,
        color: '2B6CB0',
      }),
    ],
    spacing: { after: 300 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Actividad Evaluada: Refactorización y Personalización de un Sistema Agéntico mediante Skills Propias',
        bold: true,
        size: 28,
        color: '1A202C',
      }),
    ],
    spacing: { after: 200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'Proyecto: Orbit (Videojuego 2D: Plasma Orb) | Noviembre 2026',
        italics: true,
        size: 20,
        color: '718096',
      }),
    ],
    spacing: { after: 600 },
  })
);

// Procesar párrafos y secciones del documento
let inCodeBlock = false;
let codeBuffer = [];

for (let line of lines) {
  const trimmed = line.trim();

  if (trimmed.startsWith('```')) {
    if (inCodeBlock) {
      // Fin de bloque de código
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: codeBuffer.join('\n'),
              font: 'Consolas',
              size: 18,
              color: '2D3748',
            }),
          ],
          spacing: { before: 120, after: 120 },
        })
      );
      codeBuffer = [];
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
    }
    continue;
  }

  if (inCodeBlock) {
    codeBuffer.push(line);
    continue;
  }

  if (trimmed.startsWith('# “Academia de Tecnología Creativa”') || trimmed.startsWith('**Formación Académica:**')) {
    continue; // Ya renderizado en la portada
  }

  if (trimmed.startsWith('## ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: trimmed.replace(/^##\s+/, ''),
            bold: true,
            size: 26,
            color: '1A365D',
          }),
        ],
        spacing: { before: 360, after: 160 },
      })
    );
  } else if (trimmed.startsWith('### ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: trimmed.replace(/^###\s+/, ''),
            bold: true,
            size: 22,
            color: '2B6CB0',
          }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );
  } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        children: [
          new TextRun({
            text: trimmed.replace(/^[-*]\s+/, ''),
            size: 21,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  } else if (trimmed.length > 0 && !trimmed.startsWith('---') && !trimmed.startsWith('|')) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmed,
            size: 21,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: children,
    },
  ],
});

const outPath1 = path.resolve('Tarea 4 Semana 4.docx');
const outPath2 = path.resolve('../Programacion con IA para Dev/Semana 4/Tarea 4 Semana 4.docx');

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath1, buffer);
console.log('✅ Archivo DOCX generado en:', outPath1);

try {
  fs.writeFileSync(outPath2, buffer);
  console.log('✅ Archivo DOCX copiado a:', outPath2);
} catch (e) {
  console.log('Nota: no se pudo escribir en la carpeta externa:', e.message);
}
