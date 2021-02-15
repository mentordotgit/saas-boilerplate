import logging

import contentful
from sqlalchemy.orm import Session

from dao.db.models import Base as ModelBase
from . import models

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class ContentfulSync:
    client: contentful.Client
    session: Session

    def __init__(self, client: contentful.client, session: Session):
        self.client = client
        self.session = session
        self.content_type_models = {}

    def sync(self):
        self.init_content_types()
        self.sync_entries()

    def init_content_types(self):
        content_types = self.client.content_types()
        for content_type in content_types:
            Model = self.get_db_model(content_type)
            if Model is not None:
                self.session.query(Model).update({Model.is_published: False})

    def sync_entries(self):
        skip = 0
        limit = 1000

        instances = []
        while True:
            entries = self.client.entries({'skip': skip, 'limit': limit, 'include': 0})
            skip += 1

            if not entries:
                break

            page_instances = [self.sync_entry(entry) for entry in entries]
            instances += list(filter(lambda x: x is not None, page_instances))

        self.session.add_all(instances)

    def sync_entry(self, entry: contentful.Entry):
        Model = self.get_db_model(entry.content_type)
        if Model is None:
            return None

        fields = {}
        for field_name, field in entry.fields().items():
            if isinstance(field, contentful.Link):
                fields[field_name] = field.sys
            else:
                fields[field_name] = field

        instance = Model(id=entry.sys['id'], fields=fields, is_published=True)
        return self.session.merge(instance)

    def get_db_model(self, content_type):
        db_engine = self.session.get_bind()
        table_prefix = 'content'
        table_name = f"{table_prefix}_{content_type.id.lower()}"

        if content_type.id not in self.content_type_models:
            if db_engine.dialect.has_table(db_engine, table_name=table_name):

                class ContentModel(models.ContentfulModelMixin, ModelBase):
                    __tablename__ = table_name
                    __table_args__ = {'extend_existing': True}

                self.content_type_models[content_type.id] = ContentModel
            else:
                self.content_type_models[content_type.id] = None

        return self.content_type_models[content_type.id]