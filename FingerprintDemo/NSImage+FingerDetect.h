//
//  NSImage+FingerDetect.h
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 15/02/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface NSImage (FingerDetect)
- (BOOL) containsFingerprint;
- (NSData *) fingerprintData;
@end

@interface NSData (Hex)
+ (NSData *) dataWithHex: (NSString *)hexString;
- (NSString *) hexString;
@end
