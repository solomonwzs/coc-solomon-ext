import {
  TextDocument,
  FormattingOptions,
  CancellationToken,
  Range,
  TextEdit,
  Uri,
} from 'coc.nvim';
import { logger } from '../utils/logger';
import { FormatterSetting } from '../utils/types';
import { BaseFormatter } from './baseformatter';
import { call_shell } from '../utils/externalexec';

export class CppFormatter extends BaseFormatter {
  constructor(public readonly setting: FormatterSetting) {
    super(setting);
  }

  public async formatDocument(
    document: TextDocument,
    options: FormattingOptions,
    _token: CancellationToken,
    range?: Range,
  ): Promise<TextEdit[]> {
    if (range) {
      return [];
    }

    const filepath = Uri.parse(document.uri).fsPath;
    const setting: Record<string, string> = {};
    if (this.setting.clangFormStyle) {
      for (const k in this.setting.clangFormStyle) {
        setting[k] = this.setting.clangFormStyle[k];
      }
    }
    if (options.tabSize !== undefined && !setting['IndentWidth']) {
      setting['IndentWidth'] = options.tabSize.toString();
    }
    if (options.insertSpaces !== undefined && !setting['UseTab']) {
      setting['UseTab'] = options.insertSpaces ? 'false' : 'true';
    }
    const argv: string[] = ['-style', JSON.stringify(setting), filepath];

    // if (range) {
    //   argv.push('-lines', `${range.start.line + 1}:${range.end.line + 1}`);
    // }

    const resp = await call_shell('clang-format', argv);
    if (resp.exitCode != 0) {
      if (resp.error) {
        logger.error(resp.error.toString());
      }
    } else if (resp.data) {
      return [
        TextEdit.replace(
          {
            start: { line: 0, character: 0 },
            end: { line: document.lineCount, character: 0 },
          },
          resp.data.toString(),
        ),
      ];
    }
    return [];
  }
}
