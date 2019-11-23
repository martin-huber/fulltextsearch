<?php
declare(strict_types=1);


/**
 * FullTextSearch - Full text search framework for Nextcloud
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Maxence Lange <maxence@artificial-owl.com>
 * @copyright 2018
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */


namespace OCA\FullTextSearch\Model;


use JsonSerializable;
use OCP\FullTextSearch\IFullTextSearchPlatform;
use OCP\FullTextSearch\IFullTextSearchProvider;
use OCP\FullTextSearch\Model\IIndexDocument;
use OCP\FullTextSearch\Model\ISearchRequest;
use OCP\FullTextSearch\Model\ISearchResult;


/**
 * Class SearchResult
 *
 * @package OCA\FullTextSearch\Model
 */
class SearchResult implements ISearchResult, JsonSerializable {

	/** @var IIndexDocument[] */
	private $documents = [];

	private $aggregations = [];

	/** @var string */
	private $rawResult;

	/** @var IFullTextSearchProvider */
	private $provider;

	/** @var IFullTextSearchPlatform */
	private $platform;

	/** @var int */
	private $total = 0;

	/** @var int */
	private $maxScore = 0;

	/** @var int */
	private $time = 0;

	/** @var boolean */
	private $timedOut = false;

	/** @var ISearchRequest */
	private $request;
    /**
     * @var array
     */
    private $selectedOptions = [];


    /**
	 * SearchResult constructor.
	 *
	 * @param SearchRequest $searchRequest
	 */
	public function __construct(SearchRequest $searchRequest) {
		$this->request = $searchRequest;
	}


	/**
	 * @param IIndexDocument[] $documents
	 *
	 * @return ISearchResult
	 */
	public function setDocuments(array $documents): ISearchResult {
		$this->documents = $documents;

		return $this;
	}

	/**
	 * @return IIndexDocument[]
	 */
	public function getDocuments(): array {
		return $this->documents;
	}

	/**
	 * @param IIndexDocument $document
	 *
	 * @return ISearchResult
	 */
	public function addDocument(IIndexDocument $document): ISearchResult {
		$this->documents[] = $document;

		return $this;
	}

	/**
	 * @return int
	 */
	public function getCount(): int {
		return count($this->documents);
	}


	/**
	 * @param string $result
	 *
	 * @return ISearchResult
	 */
	public function setRawResult(string $result): ISearchResult {
		$this->rawResult = $result;

		return $this;
	}

	/**
	 * @return string
	 */
	public function getRawResult(): string {
		return $this->rawResult;
	}


	/**
	 * @param IFullTextSearchProvider $provider
	 *
	 * @return ISearchResult
	 */
	public function setProvider(IFullTextSearchProvider $provider): ISearchResult {
		$this->provider = $provider;

		return $this;
	}

	/**
	 * @return IFullTextSearchProvider
	 */
	public function getProvider(): IFullTextSearchProvider {
		return $this->provider;
	}


	/**
	 * @return IFullTextSearchPlatform
	 */
	public function getPlatform(): IFullTextSearchPlatform {
		return $this->platform;
	}

	/**
	 * @param IFullTextSearchPlatform $platform
	 *
	 * @return ISearchResult
	 */
	public function setPlatform(IFullTextSearchPlatform $platform): ISearchResult {
		$this->platform = $platform;

		return $this;
	}


	/**
	 * @return int
	 */
	public function getTotal(): int {
		return $this->total;
	}

	/**
	 * @param int $total
	 *
	 * @return ISearchResult
	 */
	public function setTotal(int $total): ISearchResult {
		$this->total = $total;

		return $this;
	}


	/**
	 * @return int
	 */
	public function getMaxScore() {
		return $this->maxScore;
	}

	/**
	 * @param int $maxScore
	 *
	 * @return ISearchResult
	 */
	public function setMaxScore(int $maxScore): ISearchResult {
		$this->maxScore = $maxScore;

		return $this;
	}


	/**
	 * @return int
	 */
	public function getTime(): int {
		return $this->time;
	}

	/**
	 * @param int $time
	 *
	 * @return ISearchResult
	 */
	public function setTime(int $time): ISearchResult {
		$this->time = $time;

		return $this;
	}


	/**
	 * @return bool
	 */
	public function isTimedOut(): bool {
		return $this->timedOut;
	}

	/**
	 * @param bool $timedOut
	 *
	 * @return ISearchResult
	 */
	public function setTimedOut(bool $timedOut): ISearchResult {
		$this->timedOut = $timedOut;

		return $this;
	}


	/**
	 * @return ISearchRequest
	 */
	public function getRequest(): ISearchRequest {
		return $this->request;
	}

	/**
	 * @param ISearchRequest $request
	 *
	 * @return ISearchResult
	 */
	public function setRequest(ISearchRequest $request): ISearchResult {
		$this->request = $request;

		return $this;
	}


    /**
     * @param string $categoryKey
     * @param string $valueLabel
     * @param string $valueKey
     * @param int $count
     *
     * @return ISearchResult
     * @since 15.0.0
     */
    public function addAggregation(string $categoryKey, string $valueLabel, string $valueKey, int $count): ISearchResult {
        $aggregations = $this->aggregations;

        if (!array_key_exists($categoryKey, $aggregations)) {
            $aggregations[$categoryKey] = [];
        }
        array_push($aggregations[$categoryKey], [
            "valueKey" => $valueKey,
            "valueLabel" => $valueLabel,
            "count" => $count
        ]);

        $this->aggregations = $aggregations;

		return $this;
	}

	/**
	 * @param string $category
	 *
	 * @return array
	 * @since 15.0.0
	 *
	 */
	public function getAggregations(): array {
		return $this->aggregations;
	}


	/**
	 * @return array
	 */
	public function jsonSerialize(): array {

		$providerObj = $this->getProvider();
		$provider = [];
		if ($providerObj !== null) {
			$provider = [
				'id'   => $providerObj->getId(),
				'name' => $providerObj->getName()
			];
		}

		$platformObj = $this->getPlatform();
		$platform = [];
		if ($platformObj !== null) {
			$platform = [
				'id'   => $platformObj->getId(),
				'name' => $platformObj->getName()
			];
		}

		return [
			'provider'  => $provider,
			'platform'  => $platform,
			'documents' => $this->getDocuments(),
			'info'      => $this->getInfosAll(),
            'aggregations' => $this->getAggregations(),
            'selectedOptions' => $this->selectedOptions,
			'meta'      =>
				[
					'timedOut' => $this->isTimedOut(),
					'time'     => $this->getTime(),
					'count'    => $this->getCount(),
					'total'    => $this->getTotal(),
					'maxScore' => $this->getMaxScore()
				]
		];
	}

	public function addInfo(string $k, string $value): ISearchResult {
		return $this;
	}

	public function getInfo(string $k): string {
		return '';
	}

	public function getInfosAll(): array {
		return [];
	}

    public function addSelectedOptions(string $categoryKey, string $valueKey)
    {
        array_push($this->selectedOptions, ["categoryKey" => $categoryKey, "valueKey" => $valueKey]);
    }
}

