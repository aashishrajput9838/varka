import os
import sys
import logging

# Ensure project root is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.db.engine import SessionLocal, init_db
from api.db.models import Port, Carrier, Source, Fee
from workers.celery_app import run_pipeline_sync

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed")


def seed_database():
    logger.info("Initializing database schema...")
    init_db()

    db = SessionLocal()
    try:
        # 1. Seed 3 Ports
        logger.info("Seeding Ports...")
        ports_data = [
            {"unlocode": "CNSHA", "name": "Shanghai Port", "country": "CN"},
            {"unlocode": "USLAX", "name": "Port of Los Angeles", "country": "US"},
            {"unlocode": "NLRTM", "name": "Port of Rotterdam", "country": "NL"},
        ]

        port_map = {}
        for p in ports_data:
            existing = db.query(Port).filter(Port.unlocode == p["unlocode"]).first()
            if not existing:
                existing = Port(**p)
                db.add(existing)
                db.commit()
                db.refresh(existing)
                logger.info(f"  + Port created: {existing.unlocode} - {existing.name}")
            else:
                logger.info(f"  * Port already exists: {existing.unlocode}")
            port_map[existing.unlocode] = existing

        # 2. Seed 2 Carriers
        logger.info("Seeding Carriers...")
        carriers_data = [
            {"scac_code": "MAEU", "name": "Maersk Line"},
            {"scac_code": "MSCU", "name": "MSC (Mediterranean Shipping Company)"},
        ]

        carrier_map = {}
        for c in carriers_data:
            existing = db.query(Carrier).filter(Carrier.scac_code == c["scac_code"]).first()
            if not existing:
                existing = Carrier(**c)
                db.add(existing)
                db.commit()
                db.refresh(existing)
                logger.info(f"  + Carrier created: {existing.scac_code} - {existing.name}")
            else:
                logger.info(f"  * Carrier already exists: {existing.scac_code}")
            carrier_map[existing.scac_code] = existing

        # 3. Seed Sources pointing to Fixtures
        logger.info("Seeding Sources pointing to local HTML fixtures...")
        sources_data = [
            {
                "url_or_fixture_path": "fixtures/sample_carrier_tariff.html",
                "doc_type": "carrier_tariff",
                "carrier_id": carrier_map["MAEU"].id,
                "port_id": port_map["CNSHA"].id,
            },
            {
                "url_or_fixture_path": "fixtures/sample_port_authority_fees.html",
                "doc_type": "port_authority",
                "carrier_id": None,
                "port_id": port_map["USLAX"].id,
            },
            {
                "url_or_fixture_path": "fixtures/sample_terminal_charges.html",
                "doc_type": "terminal_operator",
                "carrier_id": None,
                "port_id": port_map["USLAX"].id,
            },
        ]

        source_objects = []
        for s in sources_data:
            existing = db.query(Source).filter(Source.url_or_fixture_path == s["url_or_fixture_path"]).first()
            if not existing:
                existing = Source(**s)
                db.add(existing)
                db.commit()
                db.refresh(existing)
                logger.info(f"  + Source registered: #{existing.id} ({existing.doc_type}) -> {existing.url_or_fixture_path}")
            else:
                logger.info(f"  * Source exists: #{existing.id} -> {existing.url_or_fixture_path}")
            source_objects.append(existing)

        # Clear previously extracted fees for idempotent re-seeding
        db.query(Fee).delete()
        db.commit()

        # 4. Run real extraction and normalization pipeline for each source
        logger.info("\nRunning end-to-end extraction and normalization pipeline for each source...")
        total_normalized = 0
        for src in source_objects:
            logger.info(f"\n--> Processing Source #{src.id}: {src.url_or_fixture_path} ({src.doc_type})")
            count = run_pipeline_sync(src.id)
            total_normalized += count
            logger.info(f"--> Extracted & normalized {count} fees from Source #{src.id}")

        total_ports = db.query(Port).count()
        total_carriers = db.query(Carrier).count()
        total_fees = db.query(Fee).count()

        print("\n" + "=" * 60)
        print("SEEDING COMPLETED SUCCESSFULLY!")
        print(f"Ports in DB:     {total_ports}")
        print(f"Carriers in DB:  {total_carriers}")
        print(f"Sources in DB:   {len(source_objects)}")
        print(f"Fees in DB:      {total_fees} (via pipeline normalization)")
        print("=" * 60 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
