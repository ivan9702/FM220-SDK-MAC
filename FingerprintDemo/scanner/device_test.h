//
//  device_test.h
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 03/01/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#ifndef device_test_h
#define device_test_h

#include <IOKit/IOKitLib.h>
#include <IOKit/IOCFPlugIn.h>
#include <IOKit/usb/IOUSBLib.h>
#include <CoreFoundation/CoreFoundation.h>


CFDictionaryRef create_matching_dictionary(SInt32 vendor, SInt32 product);

bool has_matching_service(SInt32 vendor, SInt32 product);

#endif /* device_test_h */
