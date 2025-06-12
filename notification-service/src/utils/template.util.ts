import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

const baseDir = path.join(__dirname, '../templates');

const PARTIALS_DIR = path.join(baseDir, 'email');
const LAYOUT_PATH = path.join(baseDir, 'layouts', 'main-layout.hbs');
const STYLE_PATH = path.join(baseDir, 'styles', 'email-style.css');

// Load all partials dynamically
fs.readdirSync(PARTIALS_DIR).forEach((file) => {
  const name = path.basename(file, '.hbs');
  const content = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf8');
  handlebars.registerPartial(name, content);
});

/**
 * Renders an email with specified template name and context
 */
export function renderEmailTemplate(templateName: string, context: Record<string, any>) {
  const layoutHtml = fs.readFileSync(LAYOUT_PATH, 'utf8');
  const styleCss = fs.readFileSync(STYLE_PATH, 'utf8');

  const bodyHtml = handlebars.compile(`{{> ${templateName} }}`)(context);
  const fullHtml = handlebars.compile(layoutHtml)({
    ...context,
    styles: styleCss,
    body: bodyHtml,
  });

  return fullHtml;
}