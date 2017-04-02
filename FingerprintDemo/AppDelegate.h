//
//  AppDelegate.h
//  FingerprintDemo
//
//  Created by Yung-Luen Lan on 29/12/2016.
//  Copyright © 2016 brocas. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate>

@property (weak) IBOutlet WebView *webView;
@property (weak) IBOutlet NSImageView *debugView;
@property (weak) IBOutlet NSButton *hasFingerprintCheckbox;

@end

