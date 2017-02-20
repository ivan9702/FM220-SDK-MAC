//
//  BCPerson.m
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 15/02/2017.
//  Copyright © 2017 brocas. All rights reserved.
//

#import "BCPerson.h"
#import "BCFingerprint.h"

@implementation BCPerson
@synthesize name, fingers;
+ (instancetype) personWithName: (NSString *)name
{
    return [[BCPerson alloc] initWithName: name];
}

- (instancetype) initWithName: (NSString *)aName
{
    self = [super init];
    if (self) {
        self.name = aName;
        self.fingers = @[];
    }
    return self;
}
@end
