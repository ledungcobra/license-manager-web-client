export enum Unit {
    SECOND = 0,
    DAY,
    MONTH,
    YEAR,
    FOREVER
}


export enum RootContractEvents {
    OnAddedNewApp = 'OnAddedNewApp',
    OnAppActivated = 'OnAppActivated',
    OnAppDeactivated = 'OnAppDeactivated',
    OnLicenseFeeChanged = 'OnLicenseFeeChanged',
    OnBalanceChanged = 'OnBalanceChanged'
}

export enum AppContractEvents {
    LicensePurchased = 'LicensePurchased',
    RestoreLicense = 'RestoreLicense',
    LicenseTokenPriceChange = 'LicenseTokenPriceChange',
    LicenseTokenActivated = 'LicenseTokenActivated',
    LicenseTokenDeActivated = 'LicenseTokenDeActivated',
}