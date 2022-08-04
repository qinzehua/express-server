
declare function jquery(selector: string): any
declare namespace jquery {
    interface AjaxSettings {
        method?: 'GET' | 'POST'
        data?: any;
    }
    
    function ajax(url: string, settings?: AjaxSettings): void;
    
    const version: number
    class Event {
        blur(eventType: EventType): void;
    }
    enum EventType {
        CustomClick
    }
    namespace fn {
        function extend(opts: {check: () => any}): void
    }
}

declare global {
    interface String {
        prependHello(): string;
    }
}

/// <reference path="foo.d.ts" />

import * as moment from 'moment';

declare module 'moment' {
    export function foo(): moment.CalendarKey;
}

declare module 'foo' {
    export function bar():string;
}

export default jquery