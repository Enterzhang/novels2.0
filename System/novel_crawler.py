import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import time
import logging
from urllib.parse import urljoin
import random

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# 定义小说分类列表
NOVEL_TAGS = [
    "玄幻", "奇幻", "武侠", "仙侠", "都市", "现实", "军事", "历史", 
    "游戏", "体育", "科幻", "悬疑", "灵异", "言情", "耽美", "竞技"
]

# 小说状态列表
NOVEL_STATUS = ["连载中", "已完结"]

class HistoryCategoryCrawler:
    def __init__(self, base_url="https://www.cb62.bar"):
        self.base_url = base_url
        self.category_url = "/lishi/"  # 历史分类路径
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def get_category_page_html(self, page=1):
        """获取历史分类分页HTML"""
        url = f"{self.base_url}{self.category_url}{page}.html"
        for _ in range(3):
            try:
                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    return response.text
                time.sleep(random.uniform(1, 2))
            except Exception as e:
                logging.error(f"请求分类页 {page} 失败: {str(e)}")
        return None

    def parse_history_book_urls(self, html):
        """解析历史分类页的书籍URL"""
        if not html:
            return []
        soup = BeautifulSoup(html, 'html.parser')
        book_items = soup.select('.hot .item a[href*="/kan/"]')
        urls = []
        for a in book_items:
            if '/kan/' in a['href']:
                urls.append(urljoin(self.base_url, a['href']))
        return urls

    def crawl_history_category(self, start_page=1, end_page=3):
        """批量爬取历史分类页书籍URL"""
        all_urls = []
        for page in range(start_page, end_page + 1):
            html = self.get_category_page_html(page)
            if not html:
                continue
            
            urls = self.parse_history_book_urls(html)
            all_urls.extend(urls)
            logging.info(f"历史分类页 {page} 解析到 {len(urls)} 个书籍URL")
            time.sleep(0.5)  # 页面间延迟
        
        unique_urls = list(set(all_urls))
        logging.info(f"历史分类共获取 {len(unique_urls)} 个唯一书籍URL")
        return unique_urls

class NovelCrawler:
    def __init__(self, novel_url, user_id="system"):
        self.novel_url = novel_url
        self.base_url = "https://www.cb62.bar"
        self.client = MongoClient('mongodb://localhost:4000')
        self.db = self.client['zhangzhixing']
        self.novels = self.db['novels']
        self.user_id = user_id
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0',
            'Accept-Language': 'zh-CN,zh;q=0.9'
        })

    def get_page(self, url):
        for _ in range(3):
            try:
                response = self.session.get(url, timeout=15)
                if response.status_code == 200:
                    return response.text
                time.sleep(2)
            except Exception as e:
                logging.error(f"获取页面失败: {url}, 错误: {str(e)}")
                time.sleep(2)
        return None

    def _generate_random_tags(self):
        """生成随机标签"""
        # 随机选择2-4个标签
        num_tags = random.randint(2, 4)
        tags = random.sample(NOVEL_TAGS, min(num_tags, len(NOVEL_TAGS)))
        return tags

    def _get_random_publication_status(self):
        """随机决定小说出版状态"""
        # 70%概率为连载中，30%概率为已完结
        return random.choices(NOVEL_STATUS, weights=[0.7, 0.3])[0]

    def build_novel_document(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        update_time = self._parse_update_time(soup)
        title = soup.select_one('h1').text.strip()
        
        # 调试输出
        print(f"\n解析小说: {title}")
        print("分类信息:", soup.select('.small span'))
        
        # 生成随机标签和出版状态
        tags = self._generate_random_tags()
        publication_status = self._get_random_publication_status()
        
        return {
            # 不再设置 _id，让 MongoDB 自动生成 ObjectId
            'user_id': self.user_id,
            'title': title,
            'author': self._get_field(soup, '.small span:first-child', '：', "佚名"),
            'tags': tags,                   # 标签数组字段
            'publication_status': publication_status,  # 出版状态
            'cover': soup.select_one('.cover img')['src'] if soup.select_one('.cover img') else "",
            'description': soup.select_one('.intro dd').text.strip() if soup.select_one('.intro dd') else "暂无简介",
            'createTime': datetime.now(),
            'updateTime': update_time,
            'chapters': [],
            'meta': {
                'totalChapters': 0,
                'totalWords': 0,
                'readCount': 0,
                'likeCount': 0,
                'commentCount': 0
            }
        }

    def _get_field(self, soup, selector, split_char, default):
        element = soup.select_one(selector)
        return element.text.split(split_char)[-1].strip() if element else default

    def _parse_update_time(self, soup):
        update_time_str = self._get_field(soup, '.small .last', '：', None)
        try:
            return datetime.strptime(update_time_str, "%Y-%m-%d %H:%M:%S") if update_time_str else datetime.now()
        except:
            return datetime.now()

    def parse_chapters(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        chapter_links = soup.select('div.listmain dd a:not([href*="javascript"])')
        chapters = []
        # 只爬取前5章
        for idx, a in enumerate(chapter_links[:5], 1):
            chapter_url = urljoin(self.base_url, a['href'])
            chapter_title = a.text.strip()
            chapter_html = self.get_page(chapter_url)
            content = self._parse_chapter_content(chapter_html)
            chapters.append({
                'chapterId': f'ch_{idx:03d}',
                'title': chapter_title,
                'content': content,
                'publishTime': datetime.now(),
                'wordCount': len(content),
                'comments': []
            })
            time.sleep(0.01)  # 添加延迟避免请求过快
        return chapters

    def _parse_chapter_content(self, html):
        if not html:
            return ""
        soup = BeautifulSoup(html, 'html.parser')
        content = soup.select_one('#chaptercontent')
        return content.get_text('\n', strip=True) if content else ""

    def crawl(self):
        main_html = self.get_page(self.novel_url)
        if not main_html:
            logging.error(f"主页爬取失败: {self.novel_url}")
            return False
        
        novel = self.build_novel_document(main_html)
        chapters = self.parse_chapters(main_html)
        
        novel['chapters'] = chapters
        novel['meta']['totalChapters'] = len(chapters)
        novel['meta']['totalWords'] = sum(chapter['wordCount'] for chapter in chapters)
        
        self._save_to_mongodb(novel)
        logging.info(f"成功保存小说 {novel['title']}，包含 {len(chapters)} 章")
        return True

    def _save_to_mongodb(self, novel):
        try:
            # 先尝试查找是否存在
            existing = self.novels.find_one({
                'user_id': novel['user_id'],
                'title': novel['title']
            })
            
            if existing:
                # 如果存在，更新除 _id 外的所有字段
                update_doc = {
                    'user_id': novel['user_id'],
                    'title': novel['title'],
                    'author': novel['author'],
                    'tags': novel['tags'],
                    'publication_status': novel['publication_status'],
                    'cover': novel['cover'],
                    'description': novel['description'],
                    'createTime': novel['createTime'],
                    'updateTime': datetime.now(),
                    'chapters': novel['chapters'],
                    'meta': novel['meta']
                }
                
                result = self.novels.update_one(
                    {'_id': existing['_id']},  # 使用已存在的 _id
                    {'$set': update_doc}
                )
                logging.info(f"小说已更新: {novel['title']}")
                logging.info(f"标签: {novel['tags']}, 出版状态: {novel['publication_status']}")
            else:
                # 如果不存在，插入新文档，让MongoDB自动生成ObjectId
                result = self.novels.insert_one(novel)
                logging.info(f"新小说已插入: {novel['title']}, ID: {result.inserted_id}")
                logging.info(f"标签: {novel['tags']}, 出版状态: {novel['publication_status']}")
                
        except Exception as e:
            logging.error(f"保存小说失败: {str(e)}")
            raise

def batch_crawl_novels(max_novels=100):
    """批量爬取小说"""
    # 使用历史分类爬虫获取URL
    history_crawler = HistoryCategoryCrawler()
    book_urls = history_crawler.crawl_history_category(start_page=3, end_page=20)
    
    # 限制爬取数量
    book_urls = book_urls[:max_novels]
    logging.info(f"准备爬取 {len(book_urls)} 本小说")
    
    success_count = 0
    for idx, url in enumerate(book_urls, 1):
        logging.info(f"开始爬取第 {idx}/{len(book_urls)} 本小说: {url}")
        crawler = NovelCrawler(url)
        if crawler.crawl():
            success_count += 1
        time.sleep(0.5)  # 在爬取不同小说之间添加延迟
    
    logging.info(f"批量爬取完成，成功爬取 {success_count}/{len(book_urls)} 本小说")

if __name__ == "__main__":
    batch_crawl_novels(max_novels=100)