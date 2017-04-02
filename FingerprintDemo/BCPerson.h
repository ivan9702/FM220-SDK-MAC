//
//  BCPerson.h
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 15/02/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSExport.h>

@class BCFingerprint;

@protocol BCPersonProtocol <JSExport>
@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSArray<BCFingerprint *> *fingers;
@end

@interface BCPerson : NSObject <BCPersonProtocol>
+ (instancetype) personWithName: (NSString *)name;
- (instancetype) initWithName: (NSString *)name;
@end
