//
//  device_test.c
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 03/01/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#include "device_test.h"

CFDictionaryRef create_matching_dictionary(SInt32 vendor, SInt32 product)
{
    CFMutableDictionaryRef d = NULL;
    CFNumberRef n = NULL;
    d = IOServiceMatching(kIOUSBDeviceClassName);
    if (d == NULL)
        goto cleanup;
    
    n = CFNumberCreate(kCFAllocatorDefault, kCFNumberSInt32Type, &vendor);
    if (n == NULL)
        goto cleanup;
    CFDictionaryAddValue(d, CFSTR(kUSBVendorID), n);
    CFRelease(n);
    
    n = CFNumberCreate(kCFAllocatorDefault, kCFNumberSInt32Type, &product);
    if (n == NULL)
        goto cleanup;
    CFDictionaryAddValue(d, CFSTR(kUSBProductID), n);
    CFRelease(n);
    
    return d;
    
cleanup:
    if (d != NULL)
        CFRelease(d);
    return NULL;
}

bool has_matching_service(SInt32 vendor, SInt32 product)
{
    CFDictionaryRef device_dictionary = create_matching_dictionary(vendor, product);
    io_iterator_t it = 0;
    io_service_t dev_ref;
    kern_return_t err;
    
    bool connected = false;
    
    err = IOServiceGetMatchingServices(kIOMasterPortDefault, device_dictionary, &it);
    
    if (err == 0) {
        while ((dev_ref = IOIteratorNext(it)) != 0) {
            connected = true;
            IOObjectRelease(dev_ref);
        }
        IOObjectRelease(it);
    }
//    CFRelease(device_dictionary);
    return connected;
}
