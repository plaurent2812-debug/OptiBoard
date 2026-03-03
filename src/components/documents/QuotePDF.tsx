import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed, standard fonts are usually fine for simple PDF, 
// but we use Helvetica (default) which is clean.

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
    },
    section: {
        marginBottom: 20,
    },
    partyInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    partyBlock: {
        width: '45%',
    },
    partyTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        marginBottom: 8,
        color: '#0f172a',
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        padding: 8,
        fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        padding: 8,
    },
    colDesc: { width: '50%' },
    colQty: { width: '15%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },

    totalSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    totalBox: {
        width: '40%',
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 4,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    totalLabel: {
        fontFamily: 'Helvetica-Bold',
    },
    totalAmount: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 14,
        color: '#0f172a',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
    }
});

interface LineItem {
    description: string;
    quantity: number;
    price: number;
}

interface QuotePDFProps {
    organizationName: string;
    clientName: string;
    clientAddress?: string;
    projectTitle: string;
    quoteDate: string;
    items: LineItem[];
    totalHT: number;
    quoteId: string;
}

export const QuotePDF = ({
    organizationName,
    clientName,
    clientAddress,
    projectTitle,
    quoteDate,
    items,
    totalHT,
    quoteId
}: QuotePDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>DEVIS</Text>
                    <Text style={styles.subtitle}>Réf: {quoteId}</Text>
                    <Text style={styles.subtitle}>Date: {quoteDate}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 14 }}>{organizationName}</Text>
                    {/* Typically, the artisan's full address/siret would go here */}
                </View>
            </View>

            {/* PARTIES INFO */}
            <View style={styles.partyInfo}>
                <View style={styles.partyBlock}>
                    <Text style={styles.partyTitle}>Projet</Text>
                    <Text>{projectTitle}</Text>
                </View>
                <View style={styles.partyBlock}>
                    <Text style={styles.partyTitle}>Client</Text>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>{clientName}</Text>
                    {clientAddress && <Text>{clientAddress}</Text>}
                </View>
            </View>

            {/* ITEMS TABLE */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>Désignation</Text>
                    <Text style={styles.colQty}>Quantité</Text>
                    <Text style={styles.colPrice}>Prix U. HT</Text>
                    <Text style={styles.colTotal}>Total HT</Text>
                </View>

                {items.map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{item.description}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colPrice}>{item.price.toLocaleString('fr-FR')} €</Text>
                        <Text style={styles.colTotal}>{(item.quantity * item.price).toLocaleString('fr-FR')} €</Text>
                    </View>
                ))}
            </View>

            {/* TOTALS */}
            <View style={styles.totalSection}>
                <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total HT :</Text>
                        <Text style={styles.totalAmount}>{totalHT.toLocaleString('fr-FR')} €</Text>
                    </View>
                    {/* Add TVA row here later if needed */}
                </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footer} fixed>
                <Text>Document généré via OptiPro - Devis valable 30 jours à compter de sa date d'émission.</Text>
            </View>

        </Page>
    </Document>
);
