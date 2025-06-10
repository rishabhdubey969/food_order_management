import { Injectable } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';

@Injectable()
export class errorService {
  private translations: Record<string, Record<string, string>> = {};

  constructor() {
    this.loadTranslations();
  }

  private loadTranslations() {
    try {
      const langDir = path.join(process.cwd(), 'src/error');
      const files = readdirSync(langDir);

      files.forEach((file) => {
        if (file.endsWith('.json')) {
          const langName = file.replace('.json', '');
          const filePath = path.join(langDir, file);
          const fileContent = readFileSync(filePath, 'utf8');
          this.translations[langName] = JSON.parse(fileContent);
        }
      });
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  }

  get(key: string, lang: string = 'en'): string {
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }

    if (this.translations['en'] && this.translations['en'][key]) {
      return this.translations['en'][key];
    }
    return key;
  }
}
