/**
 * Document Generator - Génération de documents PDF avec la charte MBC
 * 
 * Ce module permet de générer des documents PDF (devis, factures, attestations, registres)
 * respectant la charte graphique de l'entreprise MBC.
 */

import { COMPANY_INFO, getCopyrightText } from './company-info';

// Types pour les documents
export interface DocumentHeader {
  title: string;
  subtitle?: string;
  reference?: string;
  date: Date;
}

export interface DevisItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface DevisData {
  reference: string;
  date: Date;
  validityDays: number;
  client: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  project: {
    name: string;
    description?: string;
    location?: string;
  };
  items: DevisItem[];
  discount?: number; // pourcentage de remise
  tva?: number; // pourcentage TVA
  notes?: string;
}

export interface ContactRegistryEntry {
  id: number;
  date: Date;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  type: 'contact' | 'devis' | 'formation' | 'autre';
  status: 'nouveau' | 'en_cours' | 'traite' | 'archive';
  assignedTo?: string;
}

export interface AttestationData {
  type: 'formation' | 'travail' | 'stage';
  recipient: {
    name: string;
    birthDate?: Date;
    birthPlace?: string;
  };
  formation?: {
    name: string;
    startDate: Date;
    endDate: Date;
    duration: string;
    skills: string[];
  };
  reference: string;
  date: Date;
}

// Type pour un ticket (ex: événement, formation, accès)
export interface TicketData {
  reference: string;
  date: Date;
  event: string;
  holder: {
    name: string;
    email?: string;
  };
  seat?: string;
  qrCodeUrl?: string;
  notes?: string;
}

// Type pour un certificat de réussite
export interface CertificateData {
  recipient: {
    name: string;
    birthDate?: Date;
    birthPlace?: string;
  };
  course: {
    name: string;
    startDate: Date;
    endDate: Date;
    duration: string;
  };
  reference: string;
  date: Date;
  mention?: string;
}

// Génération du header HTML pour les documents
export function generateDocumentHeader(header: DocumentHeader): string {
  return `
    <div style="border-bottom: 3px solid #B91C1C; padding-bottom: 20px; margin-bottom: 30px;">
      <table style="width: 100%;">
        <tr>
          <td style="width: 60%;">
            <div style="font-size: 28px; font-weight: bold; color: #1F2937;">
              ${COMPANY_INFO.name}
            </div>
            <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
              ${COMPANY_INFO.fullName}
            </div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 8px;">
              ${COMPANY_INFO.address}<br/>
              Tél: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}<br/>
              ${COMPANY_INFO.legal.rccm} | ${COMPANY_INFO.legal.niu}
            </div>
          </td>
          <td style="width: 40%; text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: #B91C1C;">
              ${header.title}
            </div>
            ${header.subtitle ? `<div style="font-size: 14px; color: #6B7280;">${header.subtitle}</div>` : ''}
            ${header.reference ? `
              <div style="margin-top: 10px; padding: 8px; background: #F3F4F6; border-radius: 4px;">
                <div style="font-size: 11px; color: #6B7280;">Référence</div>
                <div style="font-size: 14px; font-weight: bold; color: #1F2937;">${header.reference}</div>
              </div>
            ` : ''}
            <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
              Date: ${formatDate(header.date)}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Génération du footer HTML pour les documents
export function generateDocumentFooter(pageNumber?: number, totalPages?: number): string {
  return `
    <div style="border-top: 2px solid #E5E7EB; padding-top: 15px; margin-top: 30px; font-size: 10px; color: #6B7280;">
      <table style="width: 100%;">
        <tr>
          <td style="width: 33%;">
            ${getCopyrightText()}
          </td>
          <td style="width: 34%; text-align: center;">
            ${COMPANY_INFO.email} | ${COMPANY_INFO.phone}
          </td>
          <td style="width: 33%; text-align: right;">
            ${pageNumber && totalPages ? `Page ${pageNumber}/${totalPages}` : ''}
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin-top: 10px; font-size: 9px; color: #9CA3AF;">
        ${COMPANY_INFO.legal.rccm} | ${COMPANY_INFO.legal.niu}
      </div>
    </div>
  `;
}

// Formatage de date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// Formatage de montant
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0
  }).format(amount);
}

// Génération d'un devis HTML complet
export function generateDevisHTML(data: DevisData): string {
  const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = data.discount ? (subtotal * data.discount) / 100 : 0;
  const afterDiscount = subtotal - discountAmount;
  const tvaAmount = data.tva ? (afterDiscount * data.tva) / 100 : 0;
  const total = afterDiscount + tvaAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1F2937; margin: 40px; }
        table { width: 100%; border-collapse: collapse; }
        .items-table th { background: #B91C1C; color: white; padding: 10px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #E5E7EB; }
        .items-table tr:nth-child(even) { background: #F9FAFB; }
        .total-row { font-weight: bold; }
        .highlight { background: #FEF2F2; color: #B91C1C; }
      </style>
    </head>
    <body>
      ${generateDocumentHeader({
        title: 'DEVIS',
        reference: data.reference,
        date: data.date
      })}
      
      <!-- Informations client et projet -->
      <table style="margin-bottom: 30px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
              <div style="font-weight: bold; color: #B91C1C; margin-bottom: 10px;">CLIENT</div>
              <div style="font-weight: bold;">${data.client.name}</div>
              ${data.client.address ? `<div>${data.client.address}</div>` : ''}
              ${data.client.phone ? `<div>Tél: ${data.client.phone}</div>` : ''}
              ${data.client.email ? `<div>Email: ${data.client.email}</div>` : ''}
            </div>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 20px;">
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
              <div style="font-weight: bold; color: #B91C1C; margin-bottom: 10px;">PROJET</div>
              <div style="font-weight: bold;">${data.project.name}</div>
              ${data.project.description ? `<div>${data.project.description}</div>` : ''}
              ${data.project.location ? `<div>📍 ${data.project.location}</div>` : ''}
            </div>
          </td>
        </tr>
      </table>

      <!-- Validité -->
      <div style="margin-bottom: 20px; padding: 10px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <strong>⏳ Validité du devis:</strong> ${data.validityDays} jours à compter de la date d'émission
      </div>

      <!-- Tableau des prestations -->
      <table class="items-table" style="margin-bottom: 30px;">
        <thead>
          <tr>
            <th style="width: 40%;">Description</th>
            <th style="width: 12%; text-align: center;">Quantité</th>
            <th style="width: 10%; text-align: center;">Unité</th>
            <th style="width: 18%; text-align: right;">Prix unitaire</th>
            <th style="width: 20%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: center;">${item.unit}</td>
              <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
              <td style="text-align: right;">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totaux -->
      <table style="width: 50%; margin-left: auto;">
        <tr>
          <td style="padding: 8px;">Sous-total HT</td>
          <td style="text-align: right; padding: 8px;">${formatCurrency(subtotal)}</td>
        </tr>
        ${data.discount ? `
          <tr class="highlight">
            <td style="padding: 8px;">Remise (${data.discount}%)</td>
            <td style="text-align: right; padding: 8px;">-${formatCurrency(discountAmount)}</td>
          </tr>
        ` : ''}
        ${data.tva ? `
          <tr>
            <td style="padding: 8px;">TVA (${data.tva}%)</td>
            <td style="text-align: right; padding: 8px;">${formatCurrency(tvaAmount)}</td>
          </tr>
        ` : ''}
        <tr class="total-row" style="background: #B91C1C; color: white;">
          <td style="padding: 12px; font-size: 14px;">TOTAL TTC</td>
          <td style="text-align: right; padding: 12px; font-size: 14px;">${formatCurrency(total)}</td>
        </tr>
      </table>

      ${data.notes ? `
        <div style="margin-top: 30px; padding: 15px; background: #F3F4F6; border-radius: 8px;">
          <div style="font-weight: bold; margin-bottom: 8px;">Notes et conditions:</div>
          <div>${data.notes}</div>
        </div>
      ` : ''}

      <!-- Signatures -->
      <table style="margin-top: 40px;">
        <tr>
          <td style="width: 50%; text-align: center;">
            <div style="border-top: 1px solid #1F2937; padding-top: 10px; margin: 0 30px;">
              <div style="font-weight: bold;">${COMPANY_INFO.fullName}</div>
              <div style="font-size: 10px; color: #6B7280;">Signature et cachet</div>
            </div>
          </td>
          <td style="width: 50%; text-align: center;">
            <div style="border-top: 1px solid #1F2937; padding-top: 10px; margin: 0 30px;">
              <div style="font-weight: bold;">Le Client</div>
              <div style="font-size: 10px; color: #6B7280;">Bon pour accord</div>
            </div>
          </td>
        </tr>
      </table>

      ${generateDocumentFooter()}
    </body>
    </html>
  `;
}

// Génération d'une attestation de formation HTML
export function generateAttestationHTML(data: AttestationData): string {
  const typeLabels = {
    formation: 'ATTESTATION DE FORMATION',
    travail: 'ATTESTATION DE TRAVAIL',
    stage: 'ATTESTATION DE STAGE'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1F2937; margin: 40px; }
        .certificate-border { border: 3px double #B91C1C; padding: 40px; }
        .certificate-title { font-size: 28px; font-weight: bold; color: #B91C1C; text-align: center; margin: 30px 0; }
        .recipient-name { font-size: 22px; font-weight: bold; text-align: center; color: #1F2937; margin: 20px 0; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="certificate-border">
        ${generateDocumentHeader({
          title: typeLabels[data.type],
          reference: data.reference,
          date: data.date
        })}

        <div style="text-align: center; margin: 40px 0;">
          <div style="font-size: 14px; color: #6B7280;">Le présent document atteste que</div>
          <div class="recipient-name">${data.recipient.name}</div>
          ${data.recipient.birthDate && data.recipient.birthPlace ? `
            <div style="font-size: 12px; color: #6B7280;">
              Né(e) le ${formatDate(data.recipient.birthDate)} à ${data.recipient.birthPlace}
            </div>
          ` : ''}
        </div>

        ${data.formation ? `
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              a suivi avec succès la formation
            </div>
            <div style="font-size: 18px; font-weight: bold; text-align: center; color: #B91C1C; margin-bottom: 20px;">
              ${data.formation.name}
            </div>
            <table style="width: 80%; margin: 0 auto;">
              <tr>
                <td><strong>Période:</strong></td>
                <td>Du ${formatDate(data.formation.startDate)} au ${formatDate(data.formation.endDate)}</td>
              </tr>
              <tr>
                <td><strong>Durée:</strong></td>
                <td>${data.formation.duration}</td>
              </tr>
            </table>
            
            ${data.formation.skills.length > 0 ? `
              <div style="margin-top: 20px;">
                <strong>Compétences acquises:</strong>
                <ul style="margin-top: 10px;">
                  ${data.formation.skills.map(skill => `<li>${skill}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: right;">
          <div style="display: inline-block; text-align: center;">
            <div>Fait à ${COMPANY_INFO.city}, le ${formatDate(data.date)}</div>
            <div style="margin-top: 60px; border-top: 1px solid #1F2937; padding-top: 10px;">
              <div style="font-weight: bold;">Le Directeur</div>
              <div style="font-size: 10px; color: #6B7280;">${COMPANY_INFO.fullName}</div>
            </div>
          </div>
        </div>

        ${generateDocumentFooter()}
      </div>
    </body>
    </html>
  `;
}

// Génération du registre de contacts HTML
export function generateContactRegistryHTML(
  entries: ContactRegistryEntry[],
  period: { start: Date; end: Date }
): string {
  const typeLabels = {
    contact: 'Contact',
    devis: 'Demande de devis',
    formation: 'Formation',
    autre: 'Autre'
  };

  const statusLabels = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    traite: 'Traité',
    archive: 'Archivé'
  };

  const statusColors = {
    nouveau: '#3B82F6',
    en_cours: '#F59E0B',
    traite: '#10B981',
    archive: '#6B7280'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1F2937; margin: 30px; }
        table { width: 100%; border-collapse: collapse; }
        .registry-table th { background: #B91C1C; color: white; padding: 8px; text-align: left; font-size: 10px; }
        .registry-table td { padding: 8px; border-bottom: 1px solid #E5E7EB; font-size: 10px; }
        .registry-table tr:nth-child(even) { background: #F9FAFB; }
        .status-badge { padding: 2px 8px; border-radius: 10px; font-size: 9px; color: white; }
      </style>
    </head>
    <body>
      ${generateDocumentHeader({
        title: 'REGISTRE DE CONTACTS',
        subtitle: `Période: ${formatDate(period.start)} - ${formatDate(period.end)}`,
        date: new Date()
      })}

      <div style="margin-bottom: 20px; padding: 15px; background: #F3F4F6; border-radius: 8px;">
        <strong>Résumé:</strong>
        <span style="margin-left: 20px;">Total: ${entries.length} contacts</span>
        <span style="margin-left: 20px;">Devis: ${entries.filter(e => e.type === 'devis').length}</span>
        <span style="margin-left: 20px;">Formations: ${entries.filter(e => e.type === 'formation').length}</span>
        <span style="margin-left: 20px;">Autres: ${entries.filter(e => e.type === 'contact' || e.type === 'autre').length}</span>
      </div>

      <table class="registry-table">
        <thead>
          <tr>
            <th style="width: 8%;">ID</th>
            <th style="width: 10%;">Date</th>
            <th style="width: 18%;">Nom</th>
            <th style="width: 15%;">Contact</th>
            <th style="width: 20%;">Sujet</th>
            <th style="width: 10%;">Type</th>
            <th style="width: 10%;">Statut</th>
            <th style="width: 9%;">Assigné</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => `
            <tr>
              <td>#${entry.id}</td>
              <td>${formatDate(entry.date)}</td>
              <td><strong>${entry.name}</strong></td>
              <td>
                ${entry.email}<br/>
                ${entry.phone || '-'}
              </td>
              <td>${entry.subject}</td>
              <td>${typeLabels[entry.type]}</td>
              <td>
                <span class="status-badge" style="background: ${statusColors[entry.status]};">
                  ${statusLabels[entry.status]}
                </span>
              </td>
              <td>${entry.assignedTo || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${generateDocumentFooter(1, 1)}
    </body>
    </html>
  `;
}

// Génération d'un reçu de paiement
export function generateReceiptHTML(data: {
  reference: string;
  date: Date;
  client: { name: string; email?: string };
  description: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1F2937; margin: 40px; }
      </style>
    </head>
    <body>
      ${generateDocumentHeader({
        title: 'REÇU DE PAIEMENT',
        reference: data.reference,
        date: data.date
      })}

      <div style="text-align: center; margin: 40px 0;">
        <div style="font-size: 16px; color: #6B7280; margin-bottom: 10px;">Montant reçu</div>
        <div style="font-size: 36px; font-weight: bold; color: #10B981;">${formatCurrency(data.amount)}</div>
      </div>

      <table style="width: 80%; margin: 30px auto; background: #F3F4F6; border-radius: 8px;">
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #E5E7EB;">
            <strong>Client</strong>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #E5E7EB;">
            ${data.client.name}
            ${data.client.email ? `<br/><span style="color: #6B7280;">${data.client.email}</span>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #E5E7EB;">
            <strong>Description</strong>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #E5E7EB;">
            ${data.description}
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid #E5E7EB;">
            <strong>Mode de paiement</strong>
          </td>
          <td style="padding: 15px; border-bottom: 1px solid #E5E7EB;">
            ${data.paymentMethod}
          </td>
        </tr>
        ${data.transactionId ? `
          <tr>
            <td style="padding: 15px;">
              <strong>ID Transaction</strong>
            </td>
            <td style="padding: 15px;">
              ${data.transactionId}
            </td>
          </tr>
        ` : ''}
      </table>

      <div style="text-align: center; margin-top: 40px; padding: 20px; background: #ECFDF5; border-radius: 8px;">
        <div style="font-size: 14px; color: #10B981; font-weight: bold;">✓ Paiement confirmé</div>
        <div style="font-size: 11px; color: #6B7280; margin-top: 5px;">
          Ce reçu fait foi de votre paiement
        </div>
      </div>

      ${generateDocumentFooter()}
    </body>
    </html>
  `;
}

// Génération d'un ticket HTML
export function generateTicketHTML(data: TicketData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1F2937; margin: 40px; }
        .ticket { border: 2px dashed #B91C1C; border-radius: 16px; padding: 32px; background: #F9FAFB; max-width: 500px; margin: 0 auto; }
        .ticket-title { font-size: 22px; font-weight: bold; color: #B91C1C; text-align: center; margin-bottom: 18px; }
        .ticket-info { margin-bottom: 12px; }
        .ticket-label { color: #B91C1C; font-weight: bold; }
        .ticket-qr { text-align: center; margin-top: 18px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="ticket-title">TICKET D'ACCÈS</div>
        <div class="ticket-info"><span class="ticket-label">Événement :</span> ${data.event}</div>
        <div class="ticket-info"><span class="ticket-label">Nom :</span> ${data.holder.name}</div>
        ${data.holder.email ? `<div class="ticket-info"><span class="ticket-label">Email :</span> ${data.holder.email}</div>` : ''}
        <div class="ticket-info"><span class="ticket-label">Référence :</span> ${data.reference}</div>
        <div class="ticket-info"><span class="ticket-label">Date :</span> ${formatDate(data.date)}</div>
        ${data.seat ? `<div class="ticket-info"><span class="ticket-label">Place :</span> ${data.seat}</div>` : ''}
        ${data.notes ? `<div class="ticket-info">${data.notes}</div>` : ''}
        ${data.qrCodeUrl ? `<div class="ticket-qr"><img src="${data.qrCodeUrl}" alt="QR Code" width="100" /></div>` : ''}
      </div>
    </body>
    </html>
  `;
}

// Génération d'un certificat de réussite HTML
export function generateCertificateHTML(data: CertificateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1F2937; margin: 40px; }
        .certificate-border { border: 3px double #B91C1C; padding: 40px; border-radius: 18px; background: #F9FAFB; }
        .certificate-title { font-size: 28px; font-weight: bold; color: #B91C1C; text-align: center; margin: 30px 0; }
        .recipient-name { font-size: 22px; font-weight: bold; text-align: center; color: #1F2937; margin: 20px 0; border-bottom: 2px solid #B91C1C; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="certificate-border">
        <div class="certificate-title">CERTIFICAT DE RÉUSSITE</div>
        <div style="text-align: center; margin: 40px 0;">
          <div style="font-size: 14px; color: #6B7280;">Le présent certificat atteste que</div>
          <div class="recipient-name">${data.recipient.name}</div>
          ${data.recipient.birthDate && data.recipient.birthPlace ? `
            <div style="font-size: 12px; color: #6B7280;">
              Né(e) le ${formatDate(data.recipient.birthDate)} à ${data.recipient.birthPlace}
            </div>
          ` : ''}
        </div>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <div style="text-align: center; margin-bottom: 20px;">
            a suivi avec succès la formation
          </div>
          <div style="font-size: 18px; font-weight: bold; text-align: center; color: #B91C1C; margin-bottom: 20px;">
            ${data.course.name}
          </div>
          <table style="width: 80%; margin: 0 auto;">
            <tr>
              <td><strong>Période:</strong></td>
              <td>Du ${formatDate(data.course.startDate)} au ${formatDate(data.course.endDate)}</td>
            </tr>
            <tr>
              <td><strong>Durée:</strong></td>
              <td>${data.course.duration}</td>
            </tr>
          </table>
          ${data.mention ? `<div style="margin-top: 20px;"><strong>Mention :</strong> ${data.mention}</div>` : ''}
        </div>
        <div style="margin-top: 50px; text-align: right;">
          <div style="display: inline-block; text-align: center;">
            <div>Fait à ${COMPANY_INFO.city}, le ${formatDate(data.date)}</div>
            <div style="margin-top: 60px; border-top: 1px solid #1F2937; padding-top: 10px;">
              <div style="font-weight: bold;">Le Directeur</div>
              <div style="font-size: 10px; color: #6B7280;">${COMPANY_INFO.fullName}</div>
            </div>
          </div>
        </div>
        <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #9CA3AF;">
          ${COMPANY_INFO.legal.rccm} | ${COMPANY_INFO.legal.niu}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Fonction utilitaire pour télécharger un document
export async function downloadDocument(
  html: string, 
  filename: string, 
  format: 'html' | 'pdf' = 'html'
): Promise<void> {
  if (format === 'html') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Pour PDF, on utilise l'API backend
    // Cette fonction sera appelée côté API Laravel
    console.log('PDF generation requires server-side processing');
  }
}

// Export des constantes de styles réutilisables
export const DOCUMENT_STYLES = {
  primaryColor: '#B91C1C', // madiba-red
  textColor: '#1F2937',
  mutedColor: '#6B7280',
  bgLight: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6'
};
