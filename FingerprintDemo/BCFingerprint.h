//
//  BCFingerprint.h
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 15/02/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSExport.h>

@protocol BCFingerprintExport <JSExport>
@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSData *data;
@end

@interface BCFingerprint : NSObject <BCFingerprintExport>

/* thumb, index, middle, ring, pinky */
@property (nonatomic, strong) NSImage *image;
@end
