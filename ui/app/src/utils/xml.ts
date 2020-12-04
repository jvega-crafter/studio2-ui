/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// @ts-ignore
import prettierXmlPlugin from '@prettier/plugin-xml/src/plugin';
import prettier from 'prettier/standalone';
import { nnou } from './object';
import parser, { X2jOptionsOptional } from 'fast-xml-parser';

export function fromString(xml: string): Document {
  return xml != null ? new DOMParser().parseFromString(xml, 'text/xml') : null;
}

export function serialize(doc: Node, options?: { format: boolean }): string {
  options = Object.assign({ format: true }, options || {});
  const content = new XMLSerializer().serializeToString(doc);
  return options.format ? beautify(content, { printWidth: +Infinity }) : content;
}

export function minify(xml: string) {
  throw new Error('minify error is not implemented.');
}

interface BeautifyOptions {
  tabWidth: number;
  printWidth: number;
  xmlWhitespaceSensitivity: 'ignore' | 'strict';
  xmlSelfClosingSpace: boolean;
}

export function beautify(xml: string): string;
export function beautify(xml: string, options: Partial<BeautifyOptions>): string;
export function beautify(xml: string, options?: Partial<BeautifyOptions>): string {
  return prettier.format(xml, {
    tabWidth: 2,
    printWidth: 100,
    xmlWhitespaceSensitivity: 'ignore',
    xmlSelfClosingSpace: true,
    ...options,
    // @ts-ignore
    parser: 'xml',
    plugins: [prettierXmlPlugin]
  });
}

export function getInnerHtml(element: Element, options = { trim: true }) {
  let content = element?.innerHTML;
  if (content) {
    // @ts-ignore downlevelIteration
    const matches = [...content.matchAll(/<!\[CDATA\[([\s\S\n]*?)\]\]>/g)];
    if (matches.length > 0) {
      content = matches[0][1].trim();
    }
  }
  return nnou(content) ? (options.trim ? content.trim() : content) : null;
}

export function getInnerHtmlNumber(element: Element, parser = parseInt): number {
  const content = getInnerHtml(element);
  const num = parser(content);
  if (content === null || content === '') {
    return null;
  } else if (isNaN(num)) {
    console.error(`[utils/xml/getInnerHtmlNumber] Expected number but got NaN. Received value was "${content}".`);
    return null;
  } else {
    return num;
  }
}

export function extractLocalizedElements(nodes: Array<Element> | NodeListOf<Element>) {
  const items: any = {};
  if (!Array.isArray(nodes)) {
    nodes = Array.from(nodes);
  }
  nodes.forEach((tag) => {
    const tagName = tag.tagName;
    const lang = tag.getAttribute('lang');
    if (lang === null) {
      items[tagName] = getInnerHtml(tag);
    } else {
      items[`tagName_${lang}`] = getInnerHtml(tag);
    }
  });
  return items;
}

export function commentless(xml: string) {
  return xml.replace(/<!--[\s\S\n]*?-->/g, '');
}

export function findDocumentElement(element: Element) {
  do {
    if (element instanceof XMLDocument) {
      return element;
    }
    element = element?.parentNode as Element;
  } while (element);
  return null;
}

export function createElements(doc: XMLDocument, element: Element, data: object): void {
  Object.entries(data).forEach(([tag, content]) => {
    if (tag === '@attributes') {
      Object.entries(content).forEach(([attr, value]) => {
        element.setAttribute(attr, `${value}`);
      });
    } else {
      const elem = doc.createElement(tag);
      if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
        elem.innerHTML = `${content}`;
      } else if (Array.isArray(content)) {
        console.error('[createElements] Path not implemented.');
      } else if (content instanceof Element) {
        elem.appendChild(content);
      } else {
        createElements(doc, elem, content);
      }
      element.appendChild(elem);
    }
  });
}

export function wrapElementInAuxDocument(element: Element): XMLDocument {
  return fromString(`<?xml version="1.0" encoding="UTF-8"?>${element.outerHTML}`);
}

export function deserialize(xml: string): any;
export function deserialize(xml: Node): any;
export function deserialize(xml: string, options: X2jOptionsOptional): any;
export function deserialize(xml: Node, options: X2jOptionsOptional): any;
export function deserialize(xml: string | Node, options?: X2jOptionsOptional): any {
  if (typeof xml !== 'string') {
    xml = serialize(xml);
  }
  return parser.parse(xml, {
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ...options
  });
}
