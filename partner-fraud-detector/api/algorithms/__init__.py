"""
Algorithms package for partner fraud detection
"""

from .opposite_trading import detect_opposite_trading, analyze_partner_network
from .mirror_trading import detect_mirror_trading
from .bonus_abuse import detect_bonus_abuse

__all__ = [
    'detect_opposite_trading',
    'analyze_partner_network', 
    'detect_mirror_trading',
    'detect_bonus_abuse'
]
