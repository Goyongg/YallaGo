// user default common fields and role specific fields
export const getUserDefaults = (role: string) => {
    const base = {
        averageRating: 0,
        ratingCount: 0,
        languagePreference: 'en',
        ecoPoints: 0
    };
    
    // driver default fields
    if (role === 'driver') {
        return {
            ...base,
            kycStatus: 'pending',
            vehicleId: null
        };
    }

    return base;
}