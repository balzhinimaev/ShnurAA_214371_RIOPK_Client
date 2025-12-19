// Утилиты для работы с aging buckets

export const formatAgingBucket = (bucket: string): string => {
    if (bucket === 'Current' || bucket === 'current') {
        return 'Срок оплаты не наступил';
    }
    if (bucket === '1-30' || bucket === '1_30') {
        return '1-30 дней просрочки';
    }
    if (bucket === '31-60' || bucket === '31_60') {
        return '31-60 дней просрочки';
    }
    if (bucket === '61-90' || bucket === '61_90') {
        return '61-90 дней просрочки';
    }
    if (bucket === '91+' || bucket === '91_PLUS') {
        return 'более 91 дня просрочки';
    }
    return bucket;
};

export const mapAgingBucketToApiParam = (bucket: string): string => {
    const bucketMapping: Record<string, string> = {
        '1-30 дней просрочки': '1_30',
        '31-60 дней просрочки': '31_60',
        '61-90 дней просрочки': '61_90',
        'более 91 дня просрочки': '91_PLUS',
        'Срок оплаты не наступил': 'current',
        'Current': 'current',
        '1-30 дней': '1_30',
        '31-60 дней': '31_60',
        '61-90 дней': '61_90',
        '91+ дней': '91_PLUS',
        '1-30': '1_30',
        '31-60': '31_60',
        '61-90': '61_90',
        '91+': '91_PLUS',
        '1_30': '1_30',
        '31_60': '31_60',
        '61_90': '61_90',
        '91_PLUS': '91_PLUS',
        'current': 'current'
    };

    return bucketMapping[bucket] || bucket;
};
