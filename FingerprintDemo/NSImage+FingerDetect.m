//
//  NSImage+FingerDetect.m
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 15/02/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#import "NSImage+FingerDetect.h"

@implementation NSImage (FingerDetect)
- (BOOL) containsFingerprint
{
    NSBitmapImageRep *raw_img = [NSBitmapImageRep imageRepWithData: [self TIFFRepresentation]];
    
    NSUInteger x = raw_img.pixelsWide / 2;
    
    BOOL previousWhite = NO;
    
    NSUInteger verticalSegments = 1;
    
    for (NSUInteger y = 0; y < raw_img.pixelsHigh; y++) {
        NSColor *c = [raw_img colorAtX: x y: y];
        BOOL nowWhite = ((c.redComponent + c.greenComponent + c.blueComponent) / 3.0) > 0.5;
        if (y > 0 && (previousWhite ^ nowWhite)) {
            verticalSegments++;
        }
        previousWhite = nowWhite;
    }

    return verticalSegments > 20;
}

- (NSData *) fingerprintData
{
    NSMutableData *d = [NSMutableData new];
    NSBitmapImageRep *raw_img = [NSBitmapImageRep imageRepWithData: [self TIFFRepresentation]];
    for (NSUInteger y = 0; y < raw_img.pixelsHigh; y++) {
        for (NSUInteger x = 0; x < raw_img.pixelsWide; x++) {
            NSColor *c = [raw_img colorAtX: x y: y];
            int v = 255.0 * (c.redComponent + c.greenComponent + c.blueComponent) / 3.0;
            uint8_t b[1];
            b[0] = (uint8_t)(v & 0xff);
            [d appendBytes: b length: 1];
        }
    }
    return [d subdataWithRange: NSMakeRange(0, MIN(512, d.length))];
}
@end

@implementation NSData (Hex)
+ (NSData *) dataWithHex: (NSString *)hexString
{
    NSMutableData *d = [NSMutableData new];
    for (int i = 0; i < hexString.length; i += 2) {
        NSString *s = [hexString substringWithRange: NSMakeRange(i, 2)];
        unsigned int v;
        [[NSScanner scannerWithString: s] scanHexInt: &v];
        uint8_t byte = (uint8_t)v;
        [d appendBytes: &byte length: 1];
    }
    return d;
}

- (NSString *) hexString
{
    NSMutableString *r = [NSMutableString new];
    for (int i = 0; i < self.length; i++) {
        [r appendFormat: @"%02x", ((uint8_t *)self.bytes)[i]];
    }
    return r;
}
@end
