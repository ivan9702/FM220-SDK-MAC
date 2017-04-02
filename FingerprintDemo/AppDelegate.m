//
//  AppDelegate.m
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 29/12/2016.
//  Copyright © 2016 brocas. All rights reserved.
//

#import "AppDelegate.h"
#import <JavaScriptCore/JavaScriptCore.h>
#import "FingerprintKit.h"
#import "device_test.h"
#import "NSImage+FingerDetect.h"
#import "BCPerson.h"
#import "BCFingerprint.h"
#import "libusb.h"

@interface AppDelegate ()
@property (weak) IBOutlet NSWindow *window;
@property (strong) HYFM220Scanner *scanner;

@property (nonatomic, copy) NSArray<BCPerson *> *users;

@property (nonatomic, copy) NSData *workingData;
@end

@implementation AppDelegate

- (NSArray<BCPerson *> *) usersFromPlist: (NSArray *)a
{
    NSMutableArray *result = [NSMutableArray new];
    for (NSObject *o in a) {
        if ([o isKindOfClass: [BCPerson class]]) {
            [result addObject: o];
        } else if ([o isKindOfClass: [NSDictionary class]]) {
            NSDictionary *u = (NSDictionary *)o;
            BCPerson *p = [BCPerson personWithName: u[@"name"]];
            NSMutableArray *fingers = [NSMutableArray new];
            for (NSDictionary *f in u[@"fingers"]) {
                BCFingerprint *finger = [BCFingerprint new];
                finger.name = f[@"name"];
                finger.data = [NSData dataWithHex: f[@"data"] ?: @""];
                [fingers addObject: finger];
            }
            p.fingers = [fingers copy];
            [result addObject: p];
        }
    }
    return [result copy];
}

- (void) applicationDidFinishLaunching: (NSNotification *)aNotification
{
    NSURLRequest *request = [NSURLRequest requestWithURL: [[NSBundle mainBundle] URLForResource: @"index" withExtension: @"html"]];
    [self.webView.mainFrame loadRequest: request];

    NSArray *plist = [[NSUserDefaults standardUserDefaults] arrayForKey: @"users"];
    self.users = plist ?: @[];
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        JSContext *globalContext = [[self.webView mainFrame] javaScriptContext];
        globalContext[@"app"][@"users"] = self.users;
        
        globalContext[@"cocoa_reset_finger"] = ^{
            self.workingData = nil;
        };
        
        globalContext[@"cocoa_get_finger"] = ^{
            return self.workingData.hexString;
        };
        
        globalContext[@"cocoa_match_finger"] = ^(NSString *f1, NSString *f2) {
            int diff = 0;
            NSUInteger l = MIN(f1.length, f2.length);
            for (int i = 0; i < l; i += 2) {
                NSString *s1 = [f1 substringWithRange: NSMakeRange(i, 2)];
                NSString *s2 = [f2 substringWithRange: NSMakeRange(i, 2)];
                unsigned int v1, v2;
                [[NSScanner scannerWithString: s1] scanHexInt: &v1];
                [[NSScanner scannerWithString: s2] scanHexInt: &v2];
                diff += (v1 > v2 ? v1 - v2 : v2 - v1);
            }
            NSNumber *r = @(1.0 - diff / (l * 255.0));
            NSLog(@"%@", r);
            return r;
        };
        
        globalContext[@"cocoa_update_users"] = ^(NSArray *users) {
            self.users = users;
            NSLog(@"users: %@", users);
            // serialize
            [[NSUserDefaults standardUserDefaults] setObject: users forKey: @"users"];
            [[NSUserDefaults standardUserDefaults] synchronize];
        };
    });
    
    // Testing if the device is connected
    [NSTimer scheduledTimerWithTimeInterval: 1.0 repeats: YES block:^(NSTimer * _Nonnull timer) {
        dispatch_async(dispatch_get_main_queue(), ^{
            JSContext *ctx = [[self.webView mainFrame] javaScriptContext];
            
            BOOL connected = has_matching_service(0x0bca, 0x8225) || has_matching_service(0x0bca, 0x8220);

            ctx[@"app"][@"connected"] = @(connected);
            
            if (connected && !self.scanner) {
                self.scanner = [HYFM220Scanner device];
                [self.scanner open];
            }
            
            if (!connected && self.scanner) {
                self.scanner = nil;
            }
            
            if (self.scanner) {
                NSImage *img = [self.scanner snap];
                BOOL hasFingerprint = [img containsFingerprint];
                self.debugView.image = img;
                self.hasFingerprintCheckbox.state = hasFingerprint ? NSOnState : NSOffState;
                if (hasFingerprint) {
                    self.workingData = [img fingerprintData];
                } else {
                    self.workingData = nil;
                }
                
                ctx[@"app"][@"matching"] = hasFingerprint ? self.workingData.hexString : [NSNull null];
            }
        });
    }];
}


- (void) applicationWillTerminate: (NSNotification *)aNotification
{
    self.scanner = nil;
    libusb_exit(NULL);
}

@end
