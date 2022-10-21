import * as React from 'react';
import { FormState, SCFormProps } from './types';
import styles from './styles.module.scss';

class SegmentComposition extends React.Component<SCFormProps, FormState> {
  chunkSubstr(str: string, size: number) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }

    return chunks;
  }

  getMaxPerSegment(isGSM: boolean, segmentCount: number) {
    let maxInSegment = 160;
    if (!isGSM && segmentCount === 1) maxInSegment = 70;
    if (!isGSM && segmentCount > 1) maxInSegment = 67;
    if (isGSM && segmentCount > 1) maxInSegment = 153;

    return maxInSegment;
  }

  formatChar(char: string, index: number, isGSM: boolean) {
    return (
      <span className={isGSM ? styles.gsm_chars : styles.ucs_2_chars} key={`${char}-${index}`}>
        {char}
      </span>
    );
  }

  segmentHeader(segmentIndex: number) {
    return (
      <span className={styles.segment_headers}>
        {Array(6)
          .fill(0)
          .map((value, index) => (
            <span key={`header-${segmentIndex}-${index}`} />
          ))}
      </span>
    );
  }

  transformRow(textChunk: string, isGSM: boolean) {
    return textChunk.split('').map((char, index) => this.formatChar(char, index, isGSM));
  }

  toCompositions(text: string, maxInSegment: number, segmentCount: number, isGSM: boolean) {
    const chunkedText = this.chunkSubstr(text, maxInSegment);
    return chunkedText.map((textChunk, index) => (
      <div key={`segment-part-${index}`} className={`${styles.clearfix} ${styles.segment_part}`}>
        <div className={styles.segment_label_count}>Segment {index + 1}</div>
        <div className={styles.segment_text_composition}>
          {segmentCount > 1 && this.segmentHeader(index)}
          {this.transformRow(textChunk, isGSM)}
        </div>
      </div>
    ));
  }

  render() {
    const { segmentCount, text, isGSM } = this.props;
    const maxInSegment = this.getMaxPerSegment(isGSM, segmentCount);
    const composition = this.toCompositions(text, maxInSegment, segmentCount, isGSM);
    return <div className="segment-part-composition">{composition}</div>;
  }
}

export default SegmentComposition;
