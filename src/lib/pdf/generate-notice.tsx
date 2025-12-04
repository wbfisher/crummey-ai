import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { NoticeEmailData } from '@/types';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 50,
    fontFamily: 'Times-Roman',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
    borderBottomStyle: 'solid',
    paddingBottom: 15,
    marginBottom: 20,
  },
  date: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 10,
  },
  trustName: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    marginBottom: 3,
  },
  trustDate: {
    fontSize: 11,
  },
  recipient: {
    marginTop: 20,
    marginBottom: 15,
  },
  recipientLabel: {
    fontSize: 11,
  },
  subject: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginBottom: 20,
  },
  salutation: {
    fontSize: 11,
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    marginBottom: 12,
    textAlign: 'justify',
  },
  amount: {
    fontFamily: 'Times-Bold',
  },
  deadline: {
    fontFamily: 'Times-Bold',
    color: '#cc0000',
  },
  signature: {
    marginTop: 30,
  },
  signatureLine: {
    fontSize: 11,
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
  },
  ackSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  ackTitle: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginBottom: 10,
  },
  ackText: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  ackUrl: {
    fontSize: 9,
    color: '#0066cc',
  },
});

interface NoticePDFProps {
  data: NoticeEmailData;
}

// PDF Document Component
function NoticePDF({ data }: NoticePDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{data.noticeDate}</Text>
          <Text style={styles.trustName}>{data.trustName}</Text>
          <Text style={styles.trustDate}>Dated: {data.trustDate}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text style={styles.recipientLabel}>To: {data.beneficiaryName}</Text>
        </View>

        {/* Subject */}
        <Text style={styles.subject}>Re: Notice of Right to Withdraw Funds</Text>

        {/* Salutation */}
        <Text style={styles.salutation}>Dear {data.beneficiaryName.split(' ')[0]},</Text>

        {/* Body Paragraphs */}
        <Text style={styles.paragraph}>
          This letter is to notify you that on{' '}
          <Text style={styles.amount}>{data.contributionDate}</Text>, a gift in the amount of{' '}
          <Text style={styles.amount}>
            ${data.withdrawalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>{' '}
          was made to the {data.trustName} of which you are a beneficiary.
        </Text>

        <Text style={styles.paragraph}>
          Under the terms of the trust, you have the right to withdraw a portion or all of this
          gift. Your withdrawal right will lapse on{' '}
          <Text style={styles.deadline}>{data.withdrawalDeadline}</Text>. If you do not exercise
          your withdrawal right within this period, the gift will remain in trust and will be
          managed and distributed in accordance with the trust's terms.
        </Text>

        <Text style={styles.paragraph}>
          To exercise your right to withdraw, please contact {data.trusteeName} at{' '}
          {data.trusteeEmail}
          {data.trusteePhone ? ` or ${data.trusteePhone}` : ''} no later than{' '}
          {data.withdrawalDeadline}.
        </Text>

        <Text style={styles.paragraph}>
          This notice is provided as a requirement under the trust agreement and tax regulations.
          It is not intended to encourage or discourage you from withdrawing the funds. If you
          have questions or need further clarification, please consult your personal attorney or
          advisor.
        </Text>

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={styles.signatureLine}>Sincerely,</Text>
          <Text style={styles.signatureName}>{data.trusteeName}, Trustee</Text>
          <Text style={styles.signatureLine}>{data.trusteeAddress}</Text>
          <Text style={styles.signatureLine}>{data.trusteeEmail}</Text>
          {data.trusteePhone && <Text style={styles.signatureLine}>{data.trusteePhone}</Text>}
        </View>

        {/* Acknowledgment Section */}
        <View style={styles.ackSection}>
          <Text style={styles.ackTitle}>Beneficiary Acknowledgment</Text>
          <Text style={styles.ackText}>
            Please acknowledge receipt of this notice by visiting the link below. This
            acknowledgment confirms you received notice of your withdrawal rights and does not
            affect your ability to exercise or waive those rights.
          </Text>
          <Text style={styles.ackUrl}>{data.acknowledgmentUrl}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This notice was generated electronically. A record of this notice and any
            acknowledgment will be maintained for the trust's records.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Generate PDF buffer
export async function generateNoticePDF(data: NoticeEmailData): Promise<Buffer> {
  const buffer = await renderToBuffer(<NoticePDF data={data} />);
  return Buffer.from(buffer);
}

// Generate PDF for a notice and return as base64
export async function generateNoticePDFBase64(data: NoticeEmailData): Promise<string> {
  const buffer = await generateNoticePDF(data);
  return buffer.toString('base64');
}
