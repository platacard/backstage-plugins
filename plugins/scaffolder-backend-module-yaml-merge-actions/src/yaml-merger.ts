import * as fs from 'fs-extra';
import * as YAML from 'yaml';
import path from 'path';

type ArrayMergeStrategy = 'concat' | 'replace' | 'unique';

interface MergeOptions {
  arrayMergeStrategy?: ArrayMergeStrategy;
  prependOnConcat?: boolean;
  cwd: string;
}

export class YamlMerger {
  private baseYAML: YAML.Document.Parsed;
  private overlayYAML: YAML.Document.Parsed;
  private arrayMergeStrategy: ArrayMergeStrategy;
  private prependOnConcat: boolean;

  constructor(
    baseFilePath: string,
    overlayFilePath: string,
    options: MergeOptions,
  ) {
    this.baseYAML = this.loadYAML(path.join(options.cwd, baseFilePath));
    this.overlayYAML = this.loadYAML(path.join(options.cwd, overlayFilePath));
    this.arrayMergeStrategy = options.arrayMergeStrategy || 'concat';
    this.prependOnConcat = options.prependOnConcat || false;
  }

  private loadYAML(filePath: string): YAML.Document.Parsed {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const doc = YAML.parseDocument(fileContents);

      YAML.visit(doc as YAML.Document, {
        Seq(_, node: YAML.YAMLSeq) {
          // Check if the sequence has a commentBefore
          if (node.commentBefore) {
            const { commentBefore } = node; // Extract the comment
            delete node.commentBefore; // Remove the comment from the sequence
            if (node.items.length > 0) {
              // Move the comment to the first item in the sequence
              (node.items[0] as YAML.Node).commentBefore = commentBefore;
            }
          }
        },
      });
      return doc;
    } catch (e) {
      throw new Error(`Failed to load YAML file: ${filePath}`);
    }
  }
  public merge(): YAML.Document.Parsed {
    this.deepMerge(this.baseYAML.contents, this.overlayYAML.contents);
    return this.baseYAML;
  }

  private deepMerge(base: any, overlay: any): any {
    if (YAML.isScalar(base) || YAML.isScalar(overlay)) {
      return overlay;
    }

    if (YAML.isMap(base) && YAML.isMap(overlay)) {
      overlay.items.forEach((overlayItem: any) => {
        const baseItem = base.get(overlayItem.key);
        if (baseItem) {
          base.set(
            overlayItem.key,
            this.deepMerge(baseItem, overlayItem.value),
          );
        } else {
          base.set(overlayItem.key, overlayItem.value);
        }
      });
    } else if (YAML.isSeq(base) && YAML.isSeq(overlay)) {
      base.items = this.mergeArrays(base.items, overlay.items);
    } else {
      return overlay;
    }

    return base;
  }

  private mergeArrays(baseArray: any[], overlayArray: any[]): any[] {
    switch (this.arrayMergeStrategy) {
      case 'concat':
        return this.prependOnConcat
          ? overlayArray.concat(baseArray)
          : baseArray.concat(overlayArray);
      case 'replace':
        return overlayArray;
      case 'unique': {
        const set = new Set(baseArray.map(item => YAML.stringify(item)));
        overlayArray.forEach(item => {
          const serializedItem = YAML.stringify(item);
          if (!set.has(serializedItem)) {
            baseArray.push(item);
            set.add(serializedItem);
          }
        });
        return baseArray;
      }
      default:
        return baseArray;
    }
  }

  public saveMergedYAML(outputFilePath: string): void {
    const mergedYAML = this.merge().toString();
    fs.writeFileSync(outputFilePath, mergedYAML, 'utf8');
  }
}
