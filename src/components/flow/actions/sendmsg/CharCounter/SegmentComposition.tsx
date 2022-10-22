import * as React from 'react';
import { FormState, SCFormProps } from './types';
import styles from './styles.module.scss';
import {
  GSM7_EXTENDED,
  GSM7_MULTI_SEGMENTS,
  GSM7_SINGLE_SEGMENT,
  UCS2_MULTI_SEGMENTS,
  UCS2_SINGLE_SEGMENT
} from './helper';

class SegmentComposition extends React.Component<SCFormProps, FormState> {
  getMaxPerSegment(isGSM: boolean, segmentCount: number) {
    let maxInSegment = GSM7_SINGLE_SEGMENT;
    if (!isGSM && segmentCount === 1) maxInSegment = UCS2_SINGLE_SEGMENT;
    if (!isGSM && segmentCount > 1) maxInSegment = UCS2_MULTI_SEGMENTS;
    if (isGSM && segmentCount > 1) maxInSegment = GSM7_MULTI_SEGMENTS;

    return maxInSegment;
  }

  formatChar(char: string, index: number, isGSM: boolean) {
    return (
      <span className={isGSM ? styles.gsm_mode : styles.ucs_2_mode} key={`${char}-${index}`}>
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

  createSegment(compositions: JSX.Element[], segmentCount: number, sCount: number) {
    return (
      <div key={`segment-part-${sCount}`} className={`${styles.clearfix} ${styles.segment_part}`}>
        <div className={styles.segment_label_count}>Segment {sCount}</div>
        <div className={styles.segment_text_composition}>
          {segmentCount > 1 && this.segmentHeader(sCount)}
          {compositions}
        </div>
      </div>
    );
  }

  addEscape(char: string, counter: number) {
    return (
      <span key={`esc-${char}-${counter}`} className={styles.gsm7_extended_char}>
        ESC
      </span>
    );
  }

  getMsgCompositions(text: string, maxInSegment: number, segmentCount: number, isGSM: boolean) {
    let compositions: JSX.Element[] = [];
    let charCounter = 0;
    const segments = [];
    let sCount = 1;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (isGSM && GSM7_EXTENDED.indexOf(char) > -1) {
        charCounter += 2;
      } else charCounter += 1;

      if (charCounter > maxInSegment) {
        charCounter -= maxInSegment;
        segments.push(this.createSegment(compositions, segmentCount, sCount));
        compositions = [];
        sCount += 1;
      }

      if (isGSM && GSM7_EXTENDED.indexOf(char) > -1) {
        compositions.push(this.addEscape(char, i));
      }

      // add to final segment if text exist and less than maxInSegment
      compositions.push(this.formatChar(char, i, isGSM));
      if (i === text.length - 1 && compositions.length > 0)
        segments.push(this.createSegment(compositions, segmentCount, sCount));
    }

    return segments;
  }

  render() {
    const { segmentCount, text, isGSM } = this.props;
    const maxInSegment = this.getMaxPerSegment(isGSM, segmentCount);
    return (
      <div className={styles.segment_part_composition}>
        {this.getMsgCompositions(text, maxInSegment, segmentCount, isGSM)}
      </div>
    );
  }
}

export default SegmentComposition;
